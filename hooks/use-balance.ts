import { useMemo } from "react";
import { BITCOIN } from "@/lib/constants";

import { Coin } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLaserEyes } from "@omnisat/lasereyes-react";

export function useBalances(address: string | undefined) {
  return useQuery({
    enabled: !!address,
    queryKey: ["balances", address],
    queryFn: async () => {
      const { data } = await axios
        .get<{
          data: Record<string, string>;
        }>(`/api/balances?address=${address}`)
        .then((res) => res.data);

      return data;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useRefetchBalances() {
  const { paymentAddress, address } = useLaserEyes();
  const { refetch: refetchPaymentAddressBalances } =
    useBalances(paymentAddress);
  const { refetch: refetchAddressBalances } = useBalances(address);

  return useMemo(
    () => () => {
      refetchPaymentAddressBalances();
      refetchAddressBalances();
    },
    [refetchPaymentAddressBalances, refetchAddressBalances]
  );
}

export function useBtcBalance() {
  const { paymentAddress } = useLaserEyes();

  const { data: paymentAddressBalances } = useBalances(paymentAddress);
  return paymentAddressBalances
    ? paymentAddressBalances[BITCOIN.id] ?? "0"
    : undefined;
}

export function useRuneBalances() {
  const { address } = useLaserEyes();

  const { data: addressBalances } = useBalances(address);
  return addressBalances ? addressBalances ?? {} : undefined;
}

export function useCoinBalance(coin: Coin | null | undefined) {
  const btcBalance = useBtcBalance();
  const runeBalances = useRuneBalances();

  return useMemo(
    () =>
      coin
        ? coin.id === BITCOIN.id
          ? btcBalance
          : runeBalances
          ? runeBalances[coin.id] ?? "0"
          : undefined
        : undefined,
    [btcBalance, runeBalances, coin]
  );
}
