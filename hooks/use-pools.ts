import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice, useCoinPrices } from "./use-prices";

import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";
import { Exchange } from "@/lib/exchange";
import { BITCOIN } from "@/lib/constants";
import useSWR from "swr";
import { PoolInfo, Position } from "@/types";

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

export function usePortfolios(address: string | undefined) {
  const { data } = useSWR(
    `/api/portfolios?address=${address}`,
    (url: string) =>
      axios
        .get<{
          data: Position[];
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 30 * 1000 }
  );

  return useMemo(() => data ?? [], [data]);
}

export function usePoolsTvl() {
  const poolsList = usePoolList();

  const coinIds = useMemo(
    () =>
      Array.from(
        new Set(poolsList.map((pool) => [pool.coinA.id, pool.coinB.id]).flat(1))
      ),
    [poolsList]
  );

  const prices = useCoinPrices(coinIds);

  const tvls = useMemo(() => {
    const tmpObj: Record<string, number> = {};
    if (!prices) {
      return tmpObj;
    }
    poolsList.forEach(({ coinA, key }) => {
      const coinAPrice = prices?.[coinA.id] ?? 0;
      const coinAValue = new Decimal(
        formatCoinAmount(coinA.balance, coinA)
      ).mul(coinAPrice);
      tmpObj[key] = coinAValue.mul(2).toNumber();
    });
    return tmpObj;
  }, [poolsList, prices]);

  return tvls;
}

export function usePoolsFee() {
  const poolsList = usePoolList();

  const btcPrice = useCoinPrice(BITCOIN.id);
  const [fees, setFees] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!btcPrice) {
      return;
    }
    const promises = poolsList.map(({ address }) =>
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
  }, [poolsList, btcPrice]);

  return fees;
}

export function usePoolTvl(poolKey: string) {
  const tvls = usePoolsTvl();

  return tvls[poolKey];
}

export function usePoolFee(poolKey: string) {
  const fees = usePoolsFee();

  return fees[poolKey];
}
