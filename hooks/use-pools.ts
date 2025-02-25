import axios from "axios";
import { useMemo } from "react";
import { useCoinPrice, useCoinPrices } from "./use-prices";

import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";

import { BITCOIN } from "@/lib/constants";
import useSWR from "swr";
import { PoolInfo } from "@/types";

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

  return data ?? [];
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
    poolsList.forEach(({ coinA, coinAAmount, key }) => {
      const coinAPrice = prices?.[coinA.id] ?? 0;
      const coinAValue = new Decimal(formatCoinAmount(coinAAmount, coinA)).mul(
        coinAPrice
      );
      tmpObj[key] = coinAValue.mul(2).toNumber();
    });
    return tmpObj;
  }, [poolsList, prices]);

  return tvls;
}

export function usePoolsFee() {
  const poolsList = usePoolList();

  const btcPrice = useCoinPrice(BITCOIN.id);

  const fees = useMemo(() => {
    const tmpObj: Record<string, number> = {};
    if (!btcPrice) {
      return tmpObj;
    }
    poolsList.forEach(({ incomes, key }) => {
      const fees = new Decimal(formatCoinAmount(incomes, BITCOIN)).mul(
        btcPrice
      );
      tmpObj[key] = fees.toNumber();
    });
    return tmpObj;
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
