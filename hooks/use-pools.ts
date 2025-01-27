import { Exchange } from "@/lib/exchange";
import { useState, useEffect, useMemo } from "react";
import { useCoinPrices } from "./use-prices";
import { PoolInfo } from "@/types";
import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";

import { useDefaultCoins } from "./use-coins";

export function usePoolList() {
  const [poolList, setPoolList] = useState<PoolInfo[]>([]);
  const coins = useDefaultCoins();

  useEffect(() => {
    Exchange.getPoolList().then((res) => {
      const pools = res.map(({ coinAId, coinBId, ...rest }) => {
        const coinA = coins[coinAId];
        const coinB = coins[coinBId];
        return {
          ...rest,
          coinA,
          coinB,
        };
      });

      setPoolList(pools);
    });
  }, [coins]);

  return poolList;
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

export function usePoolTvl(poolKey: string) {
  const tvls = usePoolsTvl();

  return tvls[poolKey];
}
