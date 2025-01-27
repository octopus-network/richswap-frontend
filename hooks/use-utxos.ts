import { UnspentOutput } from "@/types";
import axios from "axios";
import useSWR from "swr";

export function useUtxos(address: string | undefined) {
  const { data } = useSWR(
    address ? `/api/utxos?address=${address}` : undefined,
    (url: string) =>
      axios.get<{ data?: UnspentOutput[]; error: string }>(url).then((res) => {
        if (res.data.error) {
          throw new Error(res.data.error);
        }
        return res.data.data;
      }),
    { refreshInterval: 10 * 1000 }
  );

  return {
    data,
  };
}
