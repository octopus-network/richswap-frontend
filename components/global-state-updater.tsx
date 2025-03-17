"use client";

import axios from "axios";
import { usePoolList } from "@/hooks/use-pools";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrices } from "@/hooks/use-prices";

import { Orchestrator } from "@/lib/orchestrator";
import { usePendingBtcUtxos, usePendingRuneUtxos } from "@/hooks/use-utxos";
import { useLaserEyes, XVERSE } from "@omnisat/lasereyes";
import { useTransactions } from "@/store/transactions";

export function GlobalStateUpdater() {
  const { address, publicKey, paymentAddress, paymentPublicKey, provider } =
    useLaserEyes(
      ({ address, publicKey, paymentAddress, paymentPublicKey, provider }) => ({
        address,
        publicKey,
        provider,
        paymentAddress,
        paymentPublicKey,
      })
    );

  const [, setCoinPrices] = useCoinPrices();
  const [, setPendingBtcUtxos] = usePendingBtcUtxos();
  const [, setPendingRuneUtxos] = usePendingRuneUtxos();

  const [timer, setTimer] = useState<number>();

  const transactions = useTransactions();
  const poolList = usePoolList();

  const poolCoinIds = useMemo(
    () => poolList.map((pool) => pool.coinB.id),
    [poolList]
  );

  useEffect(() => {
    const interval = setInterval(
      () => setTimer(new Date().getTime()),
      30 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (poolCoinIds.length) {
      axios
        .get<{
          data: Record<string, number>;
        }>(`/api/prices?ids=${poolCoinIds.join(",")}`)
        .then((res) => setCoinPrices(res.data.data));
    }
  }, [poolCoinIds, setCoinPrices]);

  useEffect(() => {
    if (address && publicKey) {
      if (provider === XVERSE) {
        setPendingRuneUtxos([]);
      } else {
        Orchestrator.getUnconfirmedUtxos(address, publicKey).then((_utxos) => {
          setPendingRuneUtxos(_utxos);
        });
      }
    }
  }, [address, publicKey, setPendingRuneUtxos, provider, transactions, timer]);

  useEffect(() => {
    if (paymentAddress && paymentPublicKey) {
      if (provider === XVERSE) {
        setPendingRuneUtxos([]);
      } else {
        Orchestrator.getUnconfirmedUtxos(paymentAddress, paymentPublicKey).then(
          (_utxos) => {
            setPendingBtcUtxos(_utxos);
          }
        );
      }
    }
  }, [
    provider,
    paymentAddress,
    paymentPublicKey,
    setPendingBtcUtxos,
    transactions,
    timer,
  ]);

  return null;
}
