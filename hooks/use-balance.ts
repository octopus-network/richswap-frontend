import { useMemo } from "react";
import { BITCOIN } from "@/lib/constants";

import { Coin, UnspentOutput } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { formatCoinAmount } from "@/lib/utils";
import { useWalletBtcUtxos } from "./use-utxos";

function getBalanceByUtxos(coin: Coin, utxos: UnspentOutput[]): string {
  const isBitcoin = coin.id === BITCOIN.id;
  const filteredUtxos = utxos.filter((utxo) =>
    isBitcoin
      ? !utxo.runes.length
      : utxo.runes.findIndex((rune) => rune.id === coin.id) >= 0
  );

  if (!filteredUtxos.length) {
    return "0";
  }

  let amount = BigInt(0);
  for (let i = 0; i < filteredUtxos.length; i++) {
    const utxo = filteredUtxos[i];

    amount += isBitcoin
      ? BigInt(utxo.satoshis)
      : BigInt(utxo.runes.find((rune) => rune.id === coin.id)?.amount ?? 0);
  }

  return formatCoinAmount(amount.toString(), coin);
}

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
  const btcUtxos = useWalletBtcUtxos();

  return useMemo(() => getBalanceByUtxos(BITCOIN, btcUtxos ?? []), [btcUtxos]);
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
