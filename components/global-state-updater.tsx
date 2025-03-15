"use client";

import { usePoolList } from "@/hooks/use-pools";
import { useCoinPrices } from "@/hooks/use-prices";
import axios from "axios";
import { useEffect, useMemo } from "react";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useTransactions } from "@/store/transactions";
import { Orchestrator } from "@/lib/orchestrator";

import { UnspentOutput } from "@/types";

import {
  usePendingBtcUtxos,
  usePendingRuneUtxos,
  useConfirmedBtcUtxos,
  useConfirmedRuneUtxos,
} from "@/hooks/use-utxos";

export function GlobalStateUpdater() {
  const [, setPendingBtcUtxos] = usePendingBtcUtxos();
  const [, setPendingRuneUtxos] = usePendingRuneUtxos();
  const [, setConfirmedRuneUtxos] = useConfirmedRuneUtxos();
  const [, setConfirmedBtcUtxos] = useConfirmedBtcUtxos();

  const { address, paymentPublicKey, paymentAddress, publicKey } = useLaserEyes(
    ({ address, paymentAddress, paymentPublicKey, publicKey }) => ({
      paymentPublicKey,
      address,
      paymentAddress,
      publicKey,
    })
  );

  const transactions = useTransactions();

  const poolList = usePoolList();
  const [, setCoinPrices] = useCoinPrices();

  const coinIds = useMemo(
    () => poolList.map((pool) => pool.coinB.id),
    [poolList]
  );

  useEffect(() => {
    if (!address) {
      return;
    }

    if (coinIds.length) {
      axios
        .get<{
          data: UnspentOutput[];
        }>(
          `/api/utxos/rune?address=${address}${
            paymentPublicKey
              ? `&pubkey=${paymentPublicKey}&coinIds=${coinIds.join(",")}`
              : ""
          }`
        )
        .then((res) => {
          setConfirmedRuneUtxos(res.data.data);
        });
    }
    Orchestrator.getUnconfirmedUtxos(address, publicKey).then((_utxos) => {
      setPendingRuneUtxos(_utxos);
    });
  }, [address, coinIds, publicKey, setPendingRuneUtxos, transactions]);

  useEffect(() => {
    if (!paymentAddress) {
      return;
    }

    axios
      .get<{
        data: UnspentOutput[];
      }>(
        `/api/utxos/btc?address=${address}${
          paymentPublicKey ? `&pubkey=${paymentPublicKey}` : ""
        }`
      )
      .then((res) => {
        setConfirmedBtcUtxos(res.data.data);
      });

    Orchestrator.getUnconfirmedUtxos(paymentAddress, paymentPublicKey).then(
      (_utxos) => {
        setPendingBtcUtxos(_utxos);
      }
    );
  }, [paymentAddress, paymentPublicKey, setPendingBtcUtxos, transactions]);

  useEffect(() => {
    if (coinIds.length) {
      axios
        .get<{
          data: Record<string, number>;
        }>(`/api/prices?coinIds=${coinIds.join(",")}`)
        .then((res) => {
          setCoinPrices(res.data.data);
        });
    }
  }, [poolList, setCoinPrices, coinIds]);

  return null;
}
