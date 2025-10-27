import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice, useCoinPrices } from "./use-prices";

import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";

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
          data: {
            pools: PoolInfo[];
          };
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 30 * 1000 }
  );

  return useMemo(() => data?.pools ?? [], [data]);
}

export function usePoolsVolume() {
  const { data } = useSWR("/api/pools/volume/24h", (url: string) =>
    axios
      .get<{
        data: { pool_address: string; pool_name: string; volume: number }[];
      }>(url)
      .then((res) => res.data.data)
  );
  return data;
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

export function usePools7DApr() {
  const poolList = usePoolList();
  const btcPrice = useCoinPrice(BITCOIN.id);
  const poolsTvl = usePoolsTvl();

  const { data: volume7d } = useSWR("/api/pools/volume/7d", (url: string) =>
    axios
      .get<{
        data: { pool_address: string; pool_name: string; volume: number }[];
      }>(url)
      .then((res) => res.data.data)
  );

  const { data: donateVolume7d } = useSWR(
    "/api/pools/donate-volume/7d",
    (url: string) =>
      axios
        .get<{
          data: { pool_address: string; pool_name: string; volume: number }[];
        }>(url)
        .then((res) => res.data.data)
  );

  const aprs = useMemo(() => {
    const tmpObj: Record<string, number> = {};
    if (!volume7d || !donateVolume7d || !poolsTvl) {
      return tmpObj;
    }
    poolList.forEach(({ address, key }) => {
      let tvl = poolsTvl[key];
      if (tvl === 0) {
        tmpObj[key] = 0;
        return;
      }

      tvl = (tvl * Math.pow(10, 8)) / btcPrice;

      const lpFee = Math.round(
        (volume7d.find((v) => v.pool_address === address)?.volume ?? 0) * 0.003
      );

      const donateVolume =
        donateVolume7d.find((v) => v.pool_address === address)?.volume ?? 0;

      tmpObj[key] = ((lpFee + donateVolume) / tvl / 7) * 365 * 100;
    });
    return tmpObj;
  }, [volume7d, donateVolume7d, poolList, poolsTvl, btcPrice]);

  return aprs;
}

export function usePoolsTrades() {
  const { data } = useSWR(
    "/api/pools",
    (url: string) =>
      axios
        .get<{
          data: {
            trades: number;
          };
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 30 * 1000 }
  );

  return data?.trades ?? 0;
}

export function usePoolsFee() {
  const poolList = usePoolList();

  const btcPrice = useCoinPrice(BITCOIN.id);
  const [fees, setFees] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!btcPrice) {
      return;
    }

    const tmpObj: Record<string, number> = {};
    poolList.forEach((pool) => {
      const fees = new Decimal(
        formatCoinAmount(pool.lpFee ?? "0", BITCOIN)
      ).mul(btcPrice);
      tmpObj[pool.key] = fees.toNumber();
    });
    setFees(tmpObj);
  }, [poolList, btcPrice]);

  return fees;
}

export function usePoolTvl(poolKey: string | undefined) {
  const tvls = usePoolsTvl();

  return useMemo(() => (poolKey ? tvls[poolKey] : undefined), [poolKey, tvls]);
}

export function usePoolApr(poolKey: string | undefined) {
  const aprs = usePools7DApr();

  return useMemo(() => (poolKey ? aprs[poolKey] : undefined), [poolKey, aprs]);
}

export function usePoolFee(poolKey: string | undefined) {
  const fees = usePoolsFee();

  return useMemo(() => (poolKey ? fees[poolKey] : undefined), [poolKey, fees]);
}

export function usePoolVolume(poolAddress: string | undefined) {
  const volumes = usePoolsVolume();

  return useMemo(
    () =>
      poolAddress
        ? volumes?.find((p) => p.pool_address === poolAddress)?.volume ?? 0
        : undefined,
    [poolAddress, volumes]
  );
}
