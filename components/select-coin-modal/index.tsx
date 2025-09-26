"use client";

import { Coin } from "@/types";
import { useState, useMemo, ChangeEvent, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { CoinWarningModal } from "./coin-warning-modal";
import { BaseModal } from "../base-modal";
import { useDefaultCoins } from "@/hooks/use-coins";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchCoins } from "@/hooks/use-coins";
import { useTranslations } from "next-intl";
import { useAddUserCoin } from "@/store/user/hooks";
import { usePoolList, usePoolsTvl } from "@/hooks/use-pools";
import { BITCOIN } from "@/lib/constants";

import { useRuneBalances } from "@/hooks/use-balance";

import { CoinRow } from "./coin-row";

function coinFilter(query: string) {
  if (!query) return () => true;

  const searchingId = /^\d+:\d+$/.test(query);
  if (searchingId) {
    return (coin: Coin) => coin.id === query;
  }

  const queryLower = query.toLowerCase();
  return ({ name, symbol, runeSymbol, runeId }: Coin) =>
    Boolean(
      (symbol && symbol.toLowerCase().includes(queryLower)) ||
        (name && name.toLowerCase().includes(queryLower)) ||
        (runeId && runeId.toLowerCase().includes(queryLower)) ||
        (runeSymbol && runeSymbol.toLowerCase().includes(queryLower))
    );
}

export function SelectCoinModal({
  open,
  setOpen,
  onSelectCoin,
  onlySwappableCoins = false,
  toBuy,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectCoin?: (coin: Coin) => void;
  onlySwappableCoins?: boolean;
  toBuy?: boolean;
}) {
  const defaultCoins = useDefaultCoins();
  const t = useTranslations("SelectCoin");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedQuery = useDebounce(searchQuery, 150);
  const [coinWarningModalOpen, setCoinWarningModalOpen] = useState(false);
  const [toWarningCoin, setToWarningCoin] = useState<Coin>();

  const searchCoins = useSearchCoins(debouncedQuery);
  const poolList = usePoolList();
  const poolsTvl = usePoolsTvl();
  const userCoinAdder = useAddUserCoin();

  const runeBalances = useRuneBalances();

  const allCoins = useMemo(() => {
    const tvlMap = new Map<string, number>();
    poolList.forEach((pool) => {
      const tvl = poolsTvl[pool.address] ?? poolsTvl[pool.key] ?? 0;
      tvlMap.set(pool.coinB.id, tvl);
    });

    const swappableSet = new Set<string>();
    if (onlySwappableCoins) {
      swappableSet.add(BITCOIN.id);
      poolList.forEach((pool) => swappableSet.add(pool.coinB.id));
    }

    const coins = Object.values(defaultCoins);
    const filtered = onlySwappableCoins
      ? coins.filter((coin) => swappableSet.has(coin.id))
      : coins;

    const searched = filtered.filter(coinFilter(debouncedQuery));

    const sorted = searched.sort((a, b) => {
      if (a.id === "0:0") return -1;
      if (b.id === "0:0") return 1;
      if (toBuy) {
        return (tvlMap.get(b.id) ?? 0) - (tvlMap.get(a.id) ?? 0);
      } else {
        return runeBalances
          ? Number(runeBalances[b.id] ?? "0") -
              Number(runeBalances[a.id] ?? "0")
          : 0;
      }
    });

    const searchResults =
      searchCoins?.filter(
        (item) => !sorted.some((coin) => coin.id === item.id)
      ) || [];

    return [...sorted, ...searchResults];
  }, [
    defaultCoins,
    debouncedQuery,
    poolsTvl,
    poolList,
    onlySwappableCoins,
    searchCoins,
    runeBalances,
    toBuy,
  ]);

  const handleCoinSelect = useCallback(
    (coin: Coin) => {
      const isSearchResult = searchCoins?.some((sc) => sc.id === coin.id);

      if (!isSearchResult) {
        onSelectCoin?.(coin);
        setOpen(false);
      } else {
        setToWarningCoin(coin);
        setCoinWarningModalOpen(true);
      }
    },
    [onSelectCoin, setOpen, searchCoins]
  );

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    if (input.length <= 50) {
      setSearchQuery(input);
    }
  }, []);

  const handleConfirmCoin = useCallback(() => {
    if (!toWarningCoin) return;
    onSelectCoin?.(toWarningCoin);
    userCoinAdder(toWarningCoin);
    setCoinWarningModalOpen(false);
    setOpen(false);
  }, [toWarningCoin, onSelectCoin, userCoinAdder, setOpen]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <BaseModal open={open} setOpen={setOpen} className="max-w-md flex flex-col">
      <div className="px-4 pt-4">
        <div className="text-lg font-bold">{t("selectCoin")}</div>
        <div className="mt-4 border px-2 py-1 rounded-lg flex items-center hover:border-primary/60 duration-200 transition-colors">
          <Search className="size-5 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="border-none"
            onChange={handleInput}
            value={searchQuery}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(70vh_-_80px)] border-t flex-1 mt-4">
        {allCoins.map((coin) => (
          <CoinRow key={coin.id} coin={coin} onSelect={handleCoinSelect} />
        ))}
      </div>

      <CoinWarningModal
        open={coinWarningModalOpen}
        coin={toWarningCoin}
        onCancel={() => setCoinWarningModalOpen(false)}
        onConfirm={handleConfirmCoin}
      />
    </BaseModal>
  );
}
