"use client";

import { Coin } from "@/types";
import { useState, useMemo, ChangeEvent, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

import { BaseModal } from "../base-modal";
import { useDefaultCoins } from "@/hooks/use-coins";
import { useDebounce } from "@/hooks/use-debounce";
import { CoinRow } from "./coin-row";
import { useLaserEyes } from "@omnisat/lasereyes";
import Decimal from "decimal.js";
import { useCoinBalances } from "@/hooks/use-balance";

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

  return ({ name, symbol, runeSymbol }: Coin) =>
    Boolean(
      (symbol && match(symbol)) ||
        (name && match(name)) ||
        (runeSymbol && match(runeSymbol))
    );
}

export function SelectCoinModal({
  open,
  setOpen,
  onSelectCoin,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectCoin?: (coin: Coin) => void;
}) {
  const defaultCoins = useDefaultCoins();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedQuery = useDebounce(searchQuery, 200);

  const { address } = useLaserEyes();

  const coinBalances = useCoinBalances(address);
  const sortedCoins: Coin[] = useMemo(() => {
    const filteredCoins = Object.values(defaultCoins).filter(
      coinFilter(debouncedQuery)
    );

    return filteredCoins.sort((coinA, coinB) => {
      const balanceA = coinBalances[coinA.id]
        ? new Decimal(coinBalances[coinA.id])
        : undefined;
      const balanceB = coinBalances[coinB.id]
        ? new Decimal(coinBalances[coinB.id])
        : undefined;

      if (balanceA && balanceB) {
        return balanceA.equals(balanceB) ? 0 : balanceA > balanceB ? -1 : 1;
      } else if (balanceA && !balanceB?.gt(0)) {
        return -1;
      } else if (!balanceA?.gt(0) && balanceB) {
        return 1;
      }

      return -1;
    });
  }, [defaultCoins, coinBalances, debouncedQuery]);

  const handleCoinSelect = (coin: Coin) => {
    onSelectCoin?.(coin);
    setOpen(false);
  };

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setSearchQuery(input);
  }, []);

  return (
    <BaseModal open={open} setOpen={setOpen} className="max-w-md">
      <div className="px-4 pt-4">
        <div className="fle flex-col">
          <div className="text-lg font-bold">Select Coin</div>
        </div>
        <div className="mt-4 border px-2 py-1 rounded-lg flex items-center hover:border-primary/60 duration-200 transition-colors">
          <Search className="size-5 text-muted-foreground" />
          <Input
            placeholder="Input coin id or name"
            className="border-none"
            onChange={handleInput}
          />
        </div>
      </div>
      <div
        className="border-t mt-4 overflow-y-scroll"
        style={{
          height: "calc(70vh - 80px)",
        }}
      >
        {sortedCoins.map((coin, idx) => {
          return <CoinRow coin={coin} key={idx} onSelect={handleCoinSelect} />;
        })}
      </div>
    </BaseModal>
  );
}
