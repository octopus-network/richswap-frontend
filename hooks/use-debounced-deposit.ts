import { Coin, PoolInfo } from "@/types";
import { DepositQuote, DepositState } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useMemo, useState } from "react";

import { useDebounce } from "./use-debounce";

const DEBOUNCE_TIME = 550;

export function useDebouncedDeposit(
  pool: PoolInfo | undefined,
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
    if (skipFetch || !inputCoin || !inputAmount || !pool) {
      return;
    }
    setDepositQuote({
      state: DepositState.LOADING,
      inputAmount,
    });

    Exchange.preAddLiquidity(pool, inputCoin, inputAmount).then((res) => {
      setDepositQuote(res);
    });
  }, [skipFetch, inputCoin, pool, inputAmount]);

  return depositQuote ? depositQuote : undefined;
}
