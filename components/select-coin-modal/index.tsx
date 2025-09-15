"use client";

import { Coin } from "@/types";
import { useState, useMemo, ChangeEvent, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { CoinWarningModal } from "./coin-warning-modal";
import { BaseModal } from "../base-modal";
import { useDefaultCoins } from "@/hooks/use-coins";
import { useDebounce } from "@/hooks/use-debounce";
import { CoinRowLite } from "./coin-row-lite";
import { Loader2 } from "lucide-react";

import { useSearchCoins } from "@/hooks/use-coins";
import { useTranslations } from "next-intl";
import { useAddUserCoin } from "@/store/user/hooks";
import { usePoolList, usePoolsTvl } from "@/hooks/use-pools";
import { BITCOIN } from "@/lib/constants";

const BATCH_SIZE = 20;
const LOAD_DELAY = 50;

function coinFilter(query: string) {
  const searchingId = /^\d+:\d+$/.test(query);
  if (searchingId) {
    return (coin: Coin) => coin.id === query;
  }

  const queryParts = query
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0);

  if (queryParts.length === 0) return () => true;

  const match = (s: string): boolean => {
    const parts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0);

    return queryParts.every(
      (p) =>
        p.length === 0 || parts.some((sp) => sp.startsWith(p) || sp.endsWith(p))
    );
  };

  return ({ name, symbol, runeSymbol, runeId }: Coin) =>
    Boolean(
      (symbol && match(symbol)) ||
        (name && match(name)) ||
        (runeId && match(runeId)) ||
        (runeSymbol && match(runeSymbol))
    );
}

export function SelectCoinModal({
  open,
  setOpen,
  onSelectCoin,
  onlySwappableCoins = false,
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
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [coinWarningModalOpen, setCoinWarningModalOpen] = useState(false);
  const [toWarningCoin, setToWarningCoin] = useState<Coin>();
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const searchCoins = useSearchCoins(debouncedQuery);
  const poolsTvl = usePoolsTvl();
  const poolList = usePoolList();
  const userCoinAdder = useAddUserCoin();

  const allCoins: Coin[] = useMemo(() => {
    const tvlByCoinId: Record<string, number> = {};
    for (const pool of poolList) {
      const tvl = poolsTvl[pool.address] ?? poolsTvl[pool.key] ?? 0;
      tvlByCoinId[pool.coinB.id] = tvl;
    }

    const swappableSet: Record<string, boolean> = {};
    if (onlySwappableCoins) {
      swappableSet[BITCOIN.id] = true;
      for (const pool of poolList) {
        swappableSet[pool.coinB.id] = true;
      }
    }

    const filteredCoins = Object.values(defaultCoins)
      .filter((coin) => (onlySwappableCoins ? !!swappableSet[coin.id] : true))
      .filter(coinFilter(debouncedQuery));

    return filteredCoins.sort((a, b) => {
      if (a.id === "0:0") return -1;
      if (b.id === "0:0") return 1;

      const poolATvl = tvlByCoinId[a.id] ?? 0;
      const poolBTvl = tvlByCoinId[b.id] ?? 0;

      return poolBTvl - poolATvl;
    });
  }, [defaultCoins, debouncedQuery, poolsTvl, poolList, onlySwappableCoins]);

  useEffect(() => {
    if (!open) {
      setLoadedCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadedCount(BATCH_SIZE);

    const loadNextBatch = () => {
      setLoadedCount((prev) => {
        const next = prev + BATCH_SIZE;
        if (next < allCoins.length) {
          setTimeout(loadNextBatch, LOAD_DELAY);
        } else {
          setIsLoading(false);
        }
        return Math.min(next, allCoins.length);
      });
    };

    if (allCoins.length > BATCH_SIZE) {
      setTimeout(loadNextBatch, LOAD_DELAY);
    } else {
      setIsLoading(false);
    }
  }, [open, allCoins.length]);

  useEffect(() => {
    if (debouncedQuery) {
      setLoadedCount(Math.min(BATCH_SIZE, allCoins.length));
      setIsLoading(allCoins.length > BATCH_SIZE);
    }
  }, [debouncedQuery, allCoins.length]);

  const visibleCoins = useMemo(() => {
    const mainCoins = allCoins.slice(0, loadedCount);
    const searchResults =
      searchCoins
        ?.filter(
          (item) => allCoins.findIndex((coin) => coin.id === item.id) < 0
        )
        .slice(0, 20) || [];

    return [...mainCoins, ...searchResults];
  }, [allCoins, loadedCount, searchCoins]);

  const handleCoinSelect = useCallback(
    (coin: Coin, hasWarning?: boolean) => {
      if (!hasWarning) {
        onSelectCoin?.(coin);
        setOpen(false);
      } else {
        setToWarningCoin(coin);
        setCoinWarningModalOpen(true);
      }
    },
    [onSelectCoin, setOpen]
  );

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    if (input.length <= 30) {
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

  return (
    <BaseModal open={open} setOpen={setOpen} className="max-w-md">
      <div className="px-4 pt-4">
        <div className="flex flex-col">
          <div className="text-lg font-bold">{t("selectCoin")}</div>
        </div>
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

      <div className="border-t mt-4 h-[calc(70vh_-_80px)] overflow-y-auto">
        {visibleCoins.map((coin) => (
          <CoinRowLite
            key={coin.id}
            coin={coin}
            onSelect={(coin) =>
              handleCoinSelect(
                coin,
                searchCoins?.some((sc) => sc.id === coin.id)
              )
            }
          />
        ))}

        {isLoading && (
          <div className="px-4 py-4 flex items-center justify-center">
            <Loader2 className="size-4 text-muted-foreground animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading more coins...
            </span>
          </div>
        )}
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
