import { PoolInfo } from "@/types";
import { DonateQuote, DonateState } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useMemo, useState } from "react";

import { useDebounce } from "./use-debounce";

const DEBOUNCE_TIME = 550;

export function useDebouncedDonate(
  pool: PoolInfo | undefined,
  inputAmount: string
): DonateQuote | undefined {
  const inputs = useMemo(() => [inputAmount], [inputAmount]);

  const [donateQuote, setDonateQuote] = useState<DonateQuote>();

  const isDebouncing = useDebounce(inputs, DEBOUNCE_TIME) !== inputs;

  const skipFetch = isDebouncing;

  useEffect(() => {
    if (skipFetch || !inputAmount || !pool) {
      return;
    }
    setDonateQuote({
      state: DonateState.LOADING,
      coinAAmount: inputAmount,
    });

    Exchange.preDonate(pool, inputAmount).then((res) => {
      setDonateQuote(res);
    });
  }, [skipFetch, pool, inputAmount]);

  return donateQuote;
}
