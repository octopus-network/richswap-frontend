import { Coin } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { formatCoinAmount } from "@/lib/utils";
import { useDebounce } from "./use-debounce";
import { Exchange } from "@/lib/exchange";
import { SwapQuote, SwapState } from "@/types";

const DEBOUNCE_TIME = 350;

export function useDebouncedSwap(
  inputAmount: string,
  inputCoin: Coin | null,
  outputCoin: Coin | null
): SwapQuote | undefined {
  const inputs = useMemo(
    () => [inputAmount, inputCoin, outputCoin],
    [inputAmount, inputCoin, outputCoin]
  );

  const [timer, setTimer] = useState<number>();

  const [swapQuote, setSwapQuote] = useState<SwapQuote>();

  const isDebouncing = useDebounce(inputs, DEBOUNCE_TIME) !== inputs;

  const skipRoutingFetch = isDebouncing;

  useEffect(() => {
    if (skipRoutingFetch || !inputCoin || !outputCoin || !inputAmount) {
      return;
    }

    if (Number(formatCoinAmount(inputAmount, inputCoin)) < 0.00001) {
      return setSwapQuote(() => ({
        state: SwapState.INVALID,
        inputAmount,
        errorMessage: "Too small amount",
      }));
    }

    setSwapQuote((prev) => ({
      state: SwapState.LOADING,
      inputAmount,
      outputAmount: prev?.outputAmount,
    }));

    Exchange.preSwap(inputCoin, outputCoin, inputAmount).then((res) => {
      setSwapQuote(res);
    });
  }, [skipRoutingFetch, inputCoin, inputAmount, outputCoin, timer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now());
    }, 15 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return swapQuote ? swapQuote : undefined;
}
