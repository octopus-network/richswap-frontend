import { useAtomValue, useSetAtom } from "jotai";

import { typeInput } from "./actions";
import { depositStateAtom } from "./reducers";
import { useCallback, useMemo } from "react";
import { Field, PoolInfo } from "@/types";
import { parseCoinAmount } from "@/lib/utils";
import { useDebouncedDeposit } from "@/hooks/use-debounced-deposit";

export function useDepositState() {
  return useAtomValue(depositStateAtom);
}

export function useDepositActionHandlers() {
  const dispatch = useSetAtom(depositStateAtom);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }));
    },
    [dispatch]
  );

  return {
    onUserInput,
  };
}

export function useDerivedDepositInfo(poolInfo: PoolInfo) {
  const { typedValue, independentField } = useDepositState();

  const { coinA, coinB } = poolInfo;

  const isExactIn: boolean = independentField === Field.INPUT;

  const parsedAmount = useMemo(
    () => parseCoinAmount(typedValue, isExactIn ? coinA : coinB),
    [typedValue, isExactIn, coinA, coinB]
  );

  const inputCoin = isExactIn ? coinA : coinB;

  const deposit = useDebouncedDeposit(poolInfo.key, parsedAmount, inputCoin);

  return useMemo(
    () => ({
      deposit,
      parsedAmount,
    }),
    [deposit, parsedAmount]
  );
}
