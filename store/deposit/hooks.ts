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

export function useDerivedDepositInfo(poolInfo: PoolInfo | undefined) {
  const { typedValue, independentField } = useDepositState();

  const isExactIn: boolean = independentField === Field.INPUT;

  const parsedAmount = useMemo(
    () =>
      parseCoinAmount(
        typedValue,
        isExactIn ? poolInfo?.coinA : poolInfo?.coinB
      ),
    [typedValue, isExactIn, poolInfo]
  );

  const inputCoin = isExactIn ? poolInfo?.coinA : poolInfo?.coinB;

  const deposit = useDebouncedDeposit(poolInfo, parsedAmount, inputCoin);

  return useMemo(
    () => ({
      deposit,
      parsedAmount,
    }),
    [deposit, parsedAmount]
  );
}
