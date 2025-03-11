"use client";

import {
  useTransactions,
  useUpdateTransactionStatus,
} from "@/store/transactions";
import { TransactionStatus } from "@/types";
import { useMemo, useEffect, useState, useCallback } from "react";
import { retry, RetryableError } from "./retry";
import axios from "axios";
import { Orchestrator } from "@/lib/orchestrator";

import { useRemoveSpentUtxos } from "@/store/spent-utxos";
import { formatNumber } from "@/lib/utils";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { MEMPOOL_URL } from "@/lib/constants";

export function TransactionUpdater() {
  const transactions = useTransactions();

  const pendingTransactions = useMemo(
    () =>
      transactions.filter((t) => t.status === TransactionStatus.BROADCASTED),
    [transactions]
  );

  const updateTransactionStatus = useUpdateTransactionStatus();

  const removeSpentUtxos = useRemoveSpentUtxos();
  const addPopup = useAddPopup();

  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getReceipt = useCallback((txid: string) => {
    const retryOptions = { n: 60, minWait: 250, maxWait: 1000 };
    return retry(async () => {
      return Orchestrator?.getTxSent(txid).then((res: any) => {
        if (res) {
          return res;
        } else {
          return axios.get(`${MEMPOOL_URL}/api/tx/${txid}`).then((res) => {
            return res.data;
          });
        }
      });
    }, retryOptions);
  }, []);

  useEffect(() => {
    const cancels = pendingTransactions
      .filter((tx) => !!tx.txid)
      .map((tx) => {
        const { promise, cancel } = getReceipt(tx.txid!);
        promise
          .then((receipt) => {
            console.log("receipt:", receipt);
            if (receipt?.status?.confirmed) {
              addPopup(
                "Transaction Confirmed",
                PopupStatus.SUCCESS,
                `Swap ${formatNumber(tx.coinBAmount)} ${
                  tx.coinB.symbol
                } with ${formatNumber(tx.coinAAmount)} ${tx.coinA.symbol}`
              );
              updateTransactionStatus({
                txid: tx.txid,
                status: TransactionStatus.CONFIRMING,
                blockHeight: receipt?.status?.block_height,
              });
              return;
            } else if (receipt?.status === "Rejected") {
              if (tx.utxos?.length) {
                removeSpentUtxos(tx.utxos);
              }

              addPopup(
                "Transaction Failed",
                PopupStatus.ERROR,
                `Swap ${formatNumber(tx.coinBAmount)} ${
                  tx.coinB.symbol
                } with ${formatNumber(tx.coinAAmount)} ${tx.coinA.symbol}`
              );
              updateTransactionStatus({
                txid: tx.txid,
                status: TransactionStatus.REJECTED,
                message: receipt.errorMessage,
              });
              return;
            }
            throw new RetryableError();
          })
          .catch((err) => {
            console.log(err);
            // addPopup(
            //   "Transaction Failed",
            //   PopupStatus.ERROR,
            //   `Swap ${formatNumber(tx.coinBAmount)} ${
            //     tx.coinB.symbol
            //   } with ${formatNumber(tx.coinAAmount)} ${tx.coinA.symbol}`
            // );
            // updateTransactionStatus({
            //   id: tx.id,
            //   status: TransactionStatus.CONFIRM_FAILED,
            // });
          });
        return cancel;
      });
    return () => {
      cancels.forEach((cancel) => cancel());
    };
  }, [
    pendingTransactions,
    addPopup,
    getReceipt,
    updateTransactionStatus,
    timer,
    removeSpentUtxos,
  ]);

  return null;
}
