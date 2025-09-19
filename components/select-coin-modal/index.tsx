"use client";

import { Coin } from "@/types";
import {
  useState,
  useMemo,
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
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
import { getCoinSymbol, getCoinName, formatNumber } from "@/lib/utils";
import { useCoinBalance } from "@/hooks/use-balance";
import { useLaserEyes } from "@omnisat/lasereyes-react";

import { CoinIcon } from "../coin-icon";

const ITEM_HEIGHT = 64;
const CONTAINER_HEIGHT = 400;
const VISIBLE_COUNT = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 2;

function VirtualCoinRow({
  coin,
  onSelect,
  style,
}: {
  coin: Coin;
  onSelect: (coin: Coin) => void;
  style: React.CSSProperties;
}) {
  const { address } = useLaserEyes();
  const balance = useCoinBalance(coin);
  const coinSymbol = getCoinSymbol(coin);
  const coinName = getCoinName(coin);

  return (
    <div
      style={style}
      className="absolute left-0 right-0 px-4 py-2 flex items-center justify-between hover:bg-secondary/50 cursor-pointer transition-colors duration-150"
      onClick={() => onSelect(coin)}
    >
      <div className="flex items-center min-w-0 flex-1">
        <CoinIcon coin={coin} />
        <div className="flex flex-col min-w-0 flex-1 ml-2">
          <span className="font-semibold text-sm truncate">{coinSymbol}</span>
          <span className="text-muted-foreground text-xs truncate">
            {coinName}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 ml-2">
        {address ? (
          balance !== undefined ? (
            <>
              <span className="text-sm font-medium">
                {formatNumber(balance)}
              </span>
              <span className="text-xs text-muted-foreground">-</span>
            </>
          ) : (
            <>
              <div className="h-5 w-16 bg-secondary/50 rounded animate-pulse" />
              <div className="h-3 w-8 bg-secondary/30 rounded animate-pulse mt-1" />
            </>
          )
        ) : null}
      </div>
    </div>
  );
}

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
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const searchCoins = useSearchCoins(debouncedQuery);
  const poolList = usePoolList();
  const poolsTvl = usePoolsTvl();
  const userCoinAdder = useAddUserCoin();

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
      return (tvlMap.get(b.id) ?? 0) - (tvlMap.get(a.id) ?? 0);
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
  ]);

  const { visibleItems, totalHeight } = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, allCoins.length);

    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        coin: allCoins[i],
        index: i,
        top: i * ITEM_HEIGHT,
      });
    }

    return {
      visibleItems: items,
      totalHeight: allCoins.length * ITEM_HEIGHT,
    };
  }, [allCoins, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

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
      setScrollTop(0);
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
      setScrollTop(0);
    }
  }, [open]);

  return (
    <BaseModal open={open} setOpen={setOpen} className="max-w-md">
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

      <div className="border-t mt-4">
        <div
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ height: CONTAINER_HEIGHT }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {visibleItems.map(({ coin, top }) => (
              <VirtualCoinRow
                key={coin.id}
                coin={coin}
                onSelect={handleCoinSelect}
                style={{
                  top,
                  height: ITEM_HEIGHT,
                }}
              />
            ))}
          </div>
        </div>
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
