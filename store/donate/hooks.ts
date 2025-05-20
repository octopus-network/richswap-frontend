import { useAtomValue, useSetAtom } from "jotai";

import { typeInput } from "./actions";
import { donateStateAtom } from "./reducers";
import { useCallback, useMemo } from "react";
import { Field, PoolInfo } from "@/types";
import { parseCoinAmount } from "@/lib/utils";
import { useDebouncedDonate } from "@/hooks/use-debounced-donate";

export function useDonateState() {
  return useAtomValue(donateStateAtom);
}

export function useDonateActionHandlers() {
  const dispatch = useSetAtom(donateStateAtom);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ typedValue }));
    },
    [dispatch]
  );

  return {
    onUserInput,
  };
}

export function useDerivedDonateInfo(poolInfo: PoolInfo | undefined) {
  const { typedValue } = useDonateState();

  const parsedAmount = useMemo(
    () => parseCoinAmount(typedValue, poolInfo?.coinA),
    [typedValue, poolInfo]
  );

  const donate = useDebouncedDonate(poolInfo, parsedAmount);

  return useMemo(
    () => ({
      donate,
      parsedAmount,
    }),
    [donate, parsedAmount]
  );
}
