import { Coin } from "@/types";
import { DepositQuote, DepositState } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useMemo, useState } from "react";

import { useDebounce } from "./use-debounce";

const DEBOUNCE_TIME = 350;

export function useDebouncedDeposit(
  poolKey: string | undefined,
  inputAmount: string,
  inputCoin: Coin | null | undefined
): DepositQuote | undefined {
  const inputs = useMemo(
    () => [inputAmount, inputCoin],
    [inputAmount, inputCoin]
  );

  const [depositQuote, setDepositQuote] = useState<DepositQuote>();

  const isDebouncing = useDebounce(inputs, DEBOUNCE_TIME) !== inputs;

  const skipFetch = isDebouncing;

  useEffect(() => {
    if (skipFetch || !inputCoin || !inputAmount || !poolKey) {
      return;
    }
    setDepositQuote({
      state: DepositState.LOADING,
      inputAmount,
    });

    Exchange.preAddLiquidity(poolKey, inputCoin, inputAmount).then((res) => {
      setDepositQuote(res);
    });
  }, [skipFetch, inputCoin, poolKey, inputAmount]);

  return depositQuote ? depositQuote : undefined;
}
