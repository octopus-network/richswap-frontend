import axios from "axios";
import useSWR from "swr";

export function useLatestBlock() {
  const { data } = useSWR(
    `/api/latest-block`,
    (url: string) => axios.get(url).then((res) => res.data.data),
    { refreshInterval: 10 * 1000 }
  );

  return {
    data: data ? Number(data) : undefined,
  };
}
