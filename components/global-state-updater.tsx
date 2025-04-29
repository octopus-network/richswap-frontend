"use client";

import { usePoolList, usePortfolios } from "@/hooks/use-pools";
import { useEffect, useState } from "react";
import { useCoinPrices } from "@/hooks/use-prices";

import Decimal from "decimal.js";
import { Orchestrator } from "@/lib/orchestrator";
import { usePendingBtcUtxos, usePendingRuneUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useTransactions } from "@/store/transactions";
import { limitFunction } from "p-limit";
import { PoolInfo } from "@/types";
import { Exchange } from "@/lib/exchange";
import { getBtcPrice } from "@/lib/chain-api";
import { BITCOIN } from "@/lib/constants";

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
  const [btcPrice, setBtcPrice] = useState<number>();

  const [timer, setTimer] = useState<number>();

  const transactions = useTransactions();
  const poolList = usePoolList();

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
    if (poolList.length && btcPrice) {
      const tmpObj: Record<string, number> = { [BITCOIN.id]: btcPrice };

      poolList.forEach((pool) => {
        const coinPriceInBtc =
          pool.coinA.balance !== "0" && pool.coinB.balance !== "0"
            ? new Decimal(pool.coinA.balance)
                .div(Math.pow(10, pool.coinA.decimals))
                .div(
                  new Decimal(pool.coinB.balance).div(
                    Math.pow(10, pool.coinB.decimals)
                  )
                )
                .toNumber()
            : 0;

        const coinPrice = btcPrice * coinPriceInBtc;
        tmpObj[pool.coinB.id] = coinPrice;
      });

      setCoinPrices(tmpObj);
    }
  }, [poolList, setCoinPrices, btcPrice]);

  useEffect(() => {
    if (address && publicKey) {
      // Orchestrator.getUnconfirmedUtxos(address, publicKey).then((_utxos) => {
      //   setPendingRuneUtxos(_utxos);
      // });
      Orchestrator.getUnconfirmedUtxos(address, publicKey).then(() => {
        setPendingRuneUtxos([]);
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
        // (_utxos) => {
        () => {
          setPendingBtcUtxos([]);
          // setPendingBtcUtxos(_utxos);
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

  useEffect(() => {
    getBtcPrice().then((price) => {
      setBtcPrice(price);
    });
  }, [timer]);

  return null;
}
