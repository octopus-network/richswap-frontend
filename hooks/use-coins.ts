import { COIN_LIST } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import { Coin } from "@/types";
import { useUserAddedCoins } from "@/store/user/hooks";
import axios from "axios";

export function useDefaultCoins() {
  const userAddedCoins = useUserAddedCoins();
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
          ...COIN_LIST.reduce((obj, coin) => {
            obj[coin.id] = coin;
            return obj;
          }, {} as Record<string, Coin>),
        }
      ),
    [userAddedCoins]
  );
}

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
          runeid: string;
          divisibility: number;
          rune: string;
          symbol: string;
          spacedRune: string;
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
            defaultCoinsArray.findIndex((coin) => coin.id === item.runeid) < 0
        );

        const coins = filteredData.map(
          ({ runeid, spacedRune, rune, symbol, divisibility }) => ({
            id: runeid,
            name: spacedRune,
            runeId: rune,
            runeSymbol: symbol,
            decimals: divisibility,
          })
        );

        setSearchCoins(coins);
      });
  }, [searchQuery, defaultCoins]);

  return searchCoins;
}
