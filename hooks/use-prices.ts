import { useMemo } from "react";
import { atom, useAtom } from "jotai";

const coinPricesAtom = atom<Record<string, number>>({});

export function useCoinPrices() {
  return useAtom(coinPricesAtom);
}

export function useCoinPrice(id: string | undefined) {
  const [prices] = useCoinPrices();

  return useMemo(() => (id && prices ? prices[id] : 0), [id, prices]);
}
