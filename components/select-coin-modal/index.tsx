"use client";

import { Coin } from "@/types";
import { useState, useMemo, ChangeEvent, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { CoinWarningModal } from "./coin-warning-modal";
import { BaseModal } from "../base-modal";
import { useDefaultCoins } from "@/hooks/use-coins";
import { useDebounce } from "@/hooks/use-debounce";
import { CoinRow } from "./coin-row";
import { Loader2 } from "lucide-react";

import { useSearchCoins } from "@/hooks/use-coins";
import { useTranslations } from "next-intl";
import { useAddUserCoin } from "@/store/user/hooks";
import { usePoolList, usePoolsTvl } from "@/hooks/use-pools";
import { BITCOIN } from "@/lib/constants";

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
  const debouncedQuery = useDebounce(searchQuery, 500); // 增加防抖时间到500ms
  const [coinWarningModalOpen, setCoinWarningModalOpen] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [toWarningCoin, setToWarningCoin] = useState<Coin>();
  const searchCoins = useSearchCoins(debouncedQuery);
  const poolsTvl = usePoolsTvl();
  const poolList = usePoolList();

  const userCoinAdder = useAddUserCoin();

  useEffect(() => {
    setSearchQuery("");
    if (open) {
      const timer = setTimeout(() => {
        setIsModalReady(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
    }
  }, [open]);

  const sortedCoins: Coin[] = useMemo(() => {
    if (!isModalReady) return [];

    const filteredCoins = Object.values(defaultCoins)
      .filter((coin) => {
        if (onlySwappableCoins) {
          return (
            coin.id === BITCOIN.id ||
            poolList.some((pool) => pool.coinB.id === coin.id)
          );
        }
        return true;
      })
      .filter(coinFilter(debouncedQuery));

    return filteredCoins.sort((a, b) => {
      if (a.id === "0:0") return -1;
      if (b.id === "0:0") return 1;

      const poolA = poolList.find((pool) => pool.coinB.id === a.id);
      const poolB = poolList.find((pool) => pool.coinB.id === b.id);

      const poolATvl = poolA ? poolsTvl[poolA.address] : 0;
      const poolBTvl = poolB ? poolsTvl[poolB.address] : 0;

      return poolBTvl - poolATvl;
    });
  }, [
    defaultCoins,
    debouncedQuery,
    poolsTvl,
    poolList,
    onlySwappableCoins,
    isModalReady,
  ]);

  const handleCoinSelect = (coin: Coin, hasWarning?: boolean) => {
    if (!hasWarning) {
      onSelectCoin?.(coin);
      setOpen(false);
    } else {
      setToWarningCoin(coin);
      setCoinWarningModalOpen(true);
    }
  };

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
      {isModalReady ? (
        <div className="border-t mt-4 h-[calc(70vh_-_80px)] overflow-y-auto">
          {sortedCoins.map((coin) => (
            <CoinRow coin={coin} key={coin.id} onSelect={handleCoinSelect} />
          ))}
          {searchCoins?.length
            ? searchCoins
                .filter(
                  (item) =>
                    sortedCoins.findIndex((coin) => coin.id === item.id) < 0
                )
                .map((coin) => (
                  <CoinRow
                    coin={coin}
                    key={`search-${coin.id}`}
                    onSelect={(coin) => handleCoinSelect(coin, true)}
                  />
                ))
            : null}
        </div>
      ) : (
        <div className="border-t mt-4 h-[calc(70vh_-_80px)] flex items-center justify-center">
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        </div>
      )}

      <CoinWarningModal
        open={coinWarningModalOpen}
        coin={toWarningCoin}
        onCancel={() => setCoinWarningModalOpen(false)}
        onConfirm={handleConfirmCoin}
      />
    </BaseModal>
  );
}
