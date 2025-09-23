import { atom, useAtom } from "jotai";
import axios from "axios";
import useSWR from "swr";

const coinPricesAtom = atom<Record<string, number>>({});

export function useCoinPrices() {
  return useAtom(coinPricesAtom);
}

export function useCoinPrice(id: string | undefined) {
  const [prices] = useCoinPrices();

  return id && prices ? prices[id] : 0;
}

export function useBtcPrice() {
  const { data } = useSWR(
    `/api/prices?ids=0:0`,
    (url: string) =>
      axios
        .get<{ data: Record<string, number> }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 30 * 1000 }
  );

  return data?.["0:0"];
}
