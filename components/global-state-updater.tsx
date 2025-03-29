"use client";

import axios from "axios";
import { usePoolList, usePortfolios } from "@/hooks/use-pools";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrices } from "@/hooks/use-prices";

import { Orchestrator } from "@/lib/orchestrator";
import { usePendingBtcUtxos, usePendingRuneUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useTransactions } from "@/store/transactions";
import { limitFunction } from "p-limit";
import { PoolInfo } from "@/types";
import { Exchange } from "@/lib/exchange";

export function GlobalStateUpdater() {
  const { address, publicKey, paymentAddress, paymentPublicKey } = useLaserEyes(
    ({ address, publicKey, paymentAddress, paymentPublicKey }) => ({
      address,
      publicKey,
      paymentAddress,
      paymentPublicKey,
    })
  );

  const [, setCoinPrices] = useCoinPrices();
  const [, setPendingBtcUtxos] = usePendingBtcUtxos();
  const [, setPendingRuneUtxos] = usePendingRuneUtxos();
  const [, setPortfolios] = usePortfolios();

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
      Orchestrator.getUnconfirmedUtxos(address, publicKey).then((_utxos) => {
        setPendingRuneUtxos(_utxos);
      });
    }
  }, [address, publicKey, setPendingRuneUtxos, transactions, timer]);

  useEffect(() => {
    if (paymentAddress && poolList.length) {
      const limitGetPosition = limitFunction(
        async (pool: PoolInfo, address: string) =>
          Exchange.getPosition(pool, address),
        { concurrency: 2 }
      );
      Promise.all(
        poolList.map((pool) => limitGetPosition(pool, paymentAddress))
      ).then((positions) => setPortfolios(positions.filter((p) => !!p)));
    }
  }, [paymentAddress, poolList, transactions, setPortfolios, timer]);

  useEffect(() => {
    if (paymentAddress && paymentPublicKey) {
      Orchestrator.getUnconfirmedUtxos(paymentAddress, paymentPublicKey).then(
        (_utxos) => {
          setPendingBtcUtxos(_utxos);
        }
      );
    }
  }, [
    paymentAddress,
    paymentPublicKey,
    setPendingBtcUtxos,
    transactions,
    timer,
  ]);

  return null;
}
