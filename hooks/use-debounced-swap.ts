import { Coin } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { formatCoinAmount } from "@/lib/utils";
import { useDebounce } from "./use-debounce";
import { Exchange } from "@/lib/exchange";
import { SwapQuote, SwapState } from "@/types";
import { BITCOIN } from "@/lib/constants";

const DEBOUNCE_TIME = 550;

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
    if (skipRoutingFetch) {
      return;
    }

    if (!inputCoin || !outputCoin || !Number(inputAmount)) {
      return setSwapQuote(undefined);
    }

    if (Number(formatCoinAmount(inputAmount, inputCoin)) < 0.00001) {
      return setSwapQuote(() => ({
        state: SwapState.INVALID,
        errorMessage: "Too small amount",
      }));
    }

    const quote = async () => {
      setSwapQuote(() => ({
        state: SwapState.LOADING,
      }));

      try {
        if (inputCoin.id === BITCOIN.id || outputCoin.id === BITCOIN.id) {
          const route = await Exchange.getSwapRoute(
            inputCoin,
            outputCoin,
            inputAmount
          );
          setSwapQuote({
            state: SwapState.VALID,
            routes: [route],
          });
        } else {
          setSwapQuote({
            state: SwapState.INVALID,
            errorMessage: "Not Supported",
          });
        }
        // } else {
        //   const route1 = await Exchange.getSwapRoute(
        //     inputCoin,
        //     BITCOIN,
        //     inputAmount
        //   );

        //   const route2 = await Exchange.getSwapRoute(
        //     BITCOIN,
        //     outputCoin,
        //     route1.outputAmount
        //   );

        //   setSwapQuote({
        //     state: SwapState.VALID,
        //     routes: [route1, route2],
        //   });
        // }
      } catch (err: any) {
        setSwapQuote({
          state: SwapState.INVALID,
          errorMessage: err.message,
        });
      }
    };

    quote();
  }, [skipRoutingFetch, inputCoin, inputAmount, outputCoin, timer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now());
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  console.log("Swap quote", swapQuote);

  return swapQuote ? swapQuote : undefined;
}
