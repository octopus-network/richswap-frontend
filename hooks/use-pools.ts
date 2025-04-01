import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice, useCoinPrices } from "./use-prices";

import Decimal from "decimal.js";
import { fetchCoinById, formatCoinAmount } from "@/lib/utils";
import { Exchange } from "@/lib/exchange";
import { BITCOIN, REE_INDEXER_URL, EXCHANGE_ID } from "@/lib/constants";
import useSWR from "swr";
import { PoolInfo, Position } from "@/types";

import { atom, useAtom } from "jotai";
import { gql, request } from "graphql-request";

export const portfoliosAtom = atom<Position[]>();

const EXCHANGE_VIEW = gql`
  {
    exchange_view {
      logo
      exchange_link
      exchange_id
      description
      canister_id
      name
      x_link
      status
      pool_infos {
        address
        attributes
        btc_reserved
        exchange_id
        key
        key_derivation_path
        name
        nonce
        coin_reserveds {
          id
          index
          pool_exchange_id
          pool_name
          value
        }
      }
    }
  }
`;

export function usePortfolios() {
  return useAtom(portfoliosAtom);
}

export function usePoolList() {
  const [poolList, setPoolList] = useState<PoolInfo[]>([]);
  const [timer, setTimer] = useState<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(new Date().getTime());
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchPools = async () => {
      const { exchange_view } = (await request(
        REE_INDEXER_URL,
        EXCHANGE_VIEW
      )) as {
        exchange_view: {
          exchange_id: string;
          pool_infos: {
            address: string;
            attributes: string;
            btc_reserved: number;
            coin_reserveds: { id: string; value: number }[];
            name: string;
            nonce: number;
            key: string;
          }[];
        }[];
      };

      const exchangeData = exchange_view.find(
        (ex) => ex.exchange_id === EXCHANGE_ID
      );

      const res = exchangeData?.pool_infos ?? [];
      console.log(res);
      const pools: PoolInfo[] = [];

      const coinRes = await Promise.all(
        res.map(({ coin_reserveds }) => fetchCoinById(coin_reserveds[0].id))
      );

      for (let i = 0; i < res.length; i++) {
        const { name, address, btc_reserved, coin_reserveds, key } = res[i];

        const coinA = BITCOIN;
        const coinB = coinRes[i];

        pools.push({
          key,
          address,
          name,
          coinA: { ...coinA, balance: btc_reserved.toString() },
          coinB: {
            ...coinB,
            balance: coin_reserveds[0]?.value.toString() ?? "0",
          },
        });
      }

      setPoolList(pools);
    };

    fetchPools();
  }, [timer]);

  return poolList;
}

export function usePoolsTvl() {
  const poolsList = usePoolList();

  const [prices] = useCoinPrices();

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
