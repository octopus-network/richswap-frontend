import { Coin } from "@/types";
import { useSetAtom, useAtomValue } from "jotai";
import { userStateAtom } from "./reducer";

import { addCoin, toggleKlineChart } from "./actions";
import { useCallback, useMemo } from "react";

export function useAddUserCoin(): (coin: Coin) => void {
  const dispatch = useSetAtom(userStateAtom);
  return useCallback(
    (coin: Coin) => {
      dispatch(addCoin({ coin }));
    },
    [dispatch]
  );
}

export function useUserAddedCoins(): Coin[] {
  const userState = useAtomValue(userStateAtom);

  return useMemo(() => {
    const coinMap: Coin[] = userState.coins
      ? Object.values(userState.coins)
      : [];
    return coinMap;
  }, [userState]);
}

export function useToggleKlineChartOpen() {
  const dispatch = useSetAtom(userStateAtom);
  return useCallback(() => {
    dispatch(toggleKlineChart());
  }, [dispatch]);
}

export function useKlineChartOpen() {
  const userState = useAtomValue(userStateAtom);

  return useMemo(() => userState.klineChartOpen, [userState]);
}
