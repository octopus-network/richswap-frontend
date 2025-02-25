import { COIN_LIST } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import { Coin } from "@/types";
import { useUserAddedCoins } from "@/store/user/hooks";
import axios from "axios";

import { useAtomValue } from "jotai";
import { poolCoinsAtom } from "@/store/pool-coins";

export function useSearchCoins(searchQuery: string) {
  const [searchCoins, setSearchCoins] = useState<Coin[]>([]);
  const defaultCoins = useDefaultCoins();

  useEffect(() => {
    if (!searchQuery) {
      return setSearchCoins([]);
    }
    axios
      .get<{
        success: boolean;
        data?: {
          id: string;
          name: string;
          runeId: string;
          runeSymbol: string;
          decimals: number;
        }[];
      }>(`/api/runes/search?keyword=${searchQuery}`)
      .then((res) => res.data.data)
      .then((data) => {
        if (!data?.length) {
          return setSearchCoins([]);
        }
        const defaultCoinsArray = Object.values(defaultCoins);
        const filteredData = data.filter(
          (item) =>
            defaultCoinsArray.findIndex((coin) => coin.id === item.id) < 0
        );

        setSearchCoins(filteredData);
      });
  }, [searchQuery, defaultCoins]);

  return searchCoins;
}

export function useDefaultCoins() {
  const userAddedCoins = useUserAddedCoins();
  const poolCoins = useAtomValue(poolCoinsAtom);
  return useMemo(
    () =>
      userAddedCoins.reduce<{ [id: string]: Coin }>(
        (coinMap, coin) => {
          if (!coinMap[coin.id]) {
            coinMap[coin.id] = coin;
          }
          return coinMap;
        },
        {
          ...COIN_LIST.reduce(
            (obj, coin) => {
              if (!obj[coin.id]) {
                obj[coin.id] = coin;
              }
              return obj;
            },
            {
              ...poolCoins.reduce((obj, coin) => {
                if (!obj[coin.id]) {
                  obj[coin.id] = coin;
                }
                return obj;
              }, {} as Record<string, Coin>),
            }
          ),
        }
      ),
    [userAddedCoins, poolCoins]
  );
}
