import { Exchange } from "@/lib/exchange";
import { useState, useEffect, useMemo } from "react";
import { useCoinPrices } from "./use-prices";
import { PoolInfo } from "@/types";
import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";
import { useDefaultCoins } from "./use-coins";
import { fetchCoinById } from "@/lib/utils";

export function usePoolList() {
  const [poolList, setPoolList] = useState<PoolInfo[]>([]);
  const [timer, setTimer] = useState<number>();
  const coins = useDefaultCoins();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now());
    }, 15 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    Exchange.getPoolList().then(async (res) => {
      const pools = [];

      for (let i = 0; i < res.length; i++) {
        const { coinAId, coinBId, ...rest } = res[i];

        let coinA = coins[coinAId];
        let coinB = coins[coinBId];
        if (!coinB) {
          coinB = await fetchCoinById(coinBId);
        }

        pools.push({
          ...rest,
          coinA,
          coinB,
        });
      }

      setPoolList(pools);
    });
  }, [coins, timer]);

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
