import axios from "axios";
import useSWR from "swr";
import { useMemo } from "react";

export function useCoinPrices(ids: string[]) {
  const { data } = useSWR(
    ids.length ? `/api/prices?ids=${ids.join(",")}` : undefined,
    (url: string) =>
      axios
        .get<{
          data: Record<string, number>;
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 5 * 60 * 1000 }
  );

  return useMemo(() => data, [data]);
}

export function useCoinPrice(id: string | undefined) {
  const prices = useCoinPrices(id ? [id] : []);

  return useMemo(() => (id && prices ? prices[id] : 0), [id, prices]);
}
