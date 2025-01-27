import { useAtomValue, useSetAtom } from "jotai";

import { selectCoin, switchCoins, typeInput, updateCoins } from "./actions";
import { swapStateAtom } from "./reducers";
import { useCallback, useMemo } from "react";
import { useDebouncedSwap } from "@/hooks/use-debounced-swap";
import { Coin, Field } from "@/types";
import { parseCoinAmount } from "@/lib/utils";

export function useSwapState() {
  return useAtomValue(swapStateAtom);
}

export function useSwapActionHandlers() {
  const dispatch = useSetAtom(swapStateAtom);

  const onSelectCoin = useCallback(
    (field: Field, coin: Coin) => {
      dispatch(selectCoin({ field, coin }));
    },
    [dispatch]
  );

  const onUpdateCoins = useCallback(
    (coinA: Coin | null, coinB: Coin | null) => {
      dispatch(updateCoins({ coinA, coinB }));
    },
    [dispatch]
  );

  const onSwitchCoins = useCallback(() => {
    dispatch(switchCoins());
  }, [dispatch]);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }));
    },
    [dispatch]
  );

  return {
    onSelectCoin,
    onSwitchCoins,
    onUserInput,
    onUpdateCoins,
  };
}

export function useDerivedSwapInfo() {
  const {
    typedValue,
    [Field.INPUT]: { coin: coinA },
    [Field.OUTPUT]: { coin: coinB },
    independentField,
  } = useSwapState();

  const isExactIn: boolean = independentField === Field.INPUT;

  const parsedAmount = useMemo(
    () => parseCoinAmount(typedValue, isExactIn ? coinA : coinB),
    [typedValue, isExactIn, coinA, coinB]
  );

  const inputCoin = isExactIn ? coinA : coinB;
  const outputCoin = isExactIn ? coinB : coinA;

  const swap = useDebouncedSwap(parsedAmount, inputCoin, outputCoin);

  return useMemo(
    () => ({
      swap,
      parsedAmount,
    }),
    [swap, parsedAmount]
  );
}
