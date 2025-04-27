import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice, useCoinPrices } from "./use-prices";

import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";
import { Exchange } from "@/lib/exchange";
import { BITCOIN } from "@/lib/constants";
import useSWR from "swr";
import { PoolInfo, Position } from "@/types";

import { atom, useAtom } from "jotai";

export const portfoliosAtom = atom<Position[]>();

export function usePortfolios() {
  return useAtom(portfoliosAtom);
}

export function usePoolList() {
  const { data } = useSWR(
    "/api/pools",
    (url: string) =>
      axios
        .get<{
          data: PoolInfo[];
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 30 * 1000 }
  );

  return useMemo(() => data ?? [], [data]);
}

export function usePoolsTvl() {
  const poolList = usePoolList();

  const [prices] = useCoinPrices();

  const tvls = useMemo(() => {
    const tmpObj: Record<string, number> = {};
    if (!prices) {
      return tmpObj;
    }
    poolList.forEach(({ coinA, key }) => {
      const coinAPrice = prices?.[coinA.id] ?? 0;
      const coinAValue = new Decimal(
        formatCoinAmount(coinA.balance, coinA)
      ).mul(coinAPrice);
      tmpObj[key] = coinAValue.mul(2).toNumber();
    });
    return tmpObj;
  }, [poolList, prices]);

  return tvls;
}

export function usePoolsTrades() {
  const poolList = usePoolList();

  return useMemo(
    () => poolList.reduce((acc, pool) => acc + pool.nonce, 0),
    [poolList]
  );
}

export function usePoolsFee() {
  const poolList = usePoolList();

  const btcPrice = useCoinPrice(BITCOIN.id);
  const [fees, setFees] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!btcPrice) {
      return;
    }
    const promises = poolList.map(({ address }) =>
      Exchange.getPoolData(address)
    );

    Promise.all(promises).then((poolDatas) => {
      const tmpObj: Record<string, number> = {};
      poolDatas.forEach((data) => {
        if (!data) {
          return;
        }
        const fees = new Decimal(formatCoinAmount(data.incomes, BITCOIN)).mul(
          btcPrice
        );
        tmpObj[data.key] = fees.toNumber();
      });
      setFees(tmpObj);
    });
  }, [poolList, btcPrice]);

  return fees;
}

export function usePoolTvl(poolKey: string | undefined) {
  const tvls = usePoolsTvl();

  return useMemo(() => (poolKey ? tvls[poolKey] : undefined), [poolKey, tvls]);
}

export function usePoolFee(poolKey: string | undefined) {
  const fees = usePoolsFee();

  return useMemo(() => (poolKey ? fees[poolKey] : undefined), [poolKey, fees]);
}
