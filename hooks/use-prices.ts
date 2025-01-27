import axios from "axios";
import useSWR from "swr";

export function useCoinPrices(ids: string[]) {
  const { data } = useSWR(
    ids.length ? `/api/prices?ids=${ids.join(",")}` : undefined,
    (url: string) =>
      axios
        .get<{
          data: Record<string, number>;
        }>(url)
        .then((res) => res.data.data),
    { refreshInterval: 10 * 1000 }
  );

  return data;
}

export function useCoinPrice(id: string | undefined) {
  const prices = useCoinPrices(id ? [id] : []);

  return id && prices ? prices[id] : 0;
}
