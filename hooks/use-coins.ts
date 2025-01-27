import { COIN_LIST } from "@/lib/constants";
import { useMemo } from "react";
import { Coin } from "@/types";
import { useUserAddedCoins } from "@/store/user/hooks";

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
