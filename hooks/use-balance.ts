import { useMemo } from "react";
import { BITCOIN } from "@/lib/constants";
import { useDefaultCoins } from "./use-coins";
import { useUtxos } from "./use-utxos";
import { formatCoinAmount } from "@/lib/utils";
import { Coin, UnspentOutput } from "@/types";

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

export function useCoinBalances(address: string | undefined) {
  const coins = useDefaultCoins();
  const utxos = useUtxos(address);

  const balances = useMemo(() => {
    const tmpObj: Record<string, string> = {};
    if (!utxos) {
      return tmpObj;
    }

    const coinsArray = Object.values(coins);

    for (let i = 0; i < coinsArray.length; i++) {
      const coin = coinsArray[i];
      tmpObj[coin.id] = getBalanceByUtxos(coin, utxos);
    }

    return tmpObj;
  }, [utxos, coins]);

  return balances;
}

export function useCoinBalance(
  address: string | undefined,
  coinId: string | undefined
) {
  const balances = useCoinBalances(address);

  return useMemo(
    () =>
      address
        ? coinId
          ? Object.keys(balances)
            ? balances[coinId] ?? "0"
            : undefined
          : undefined
        : undefined,
    [balances, coinId, address]
  );
}
