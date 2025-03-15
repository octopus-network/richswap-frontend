"use client";

import { Coin } from "@/types";
import { useState, useMemo, ChangeEvent, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { CoinWarningModal } from "./coin-warning-modal";
import { BaseModal } from "../base-modal";
import { useDefaultCoins } from "@/hooks/use-coins";
import { useDebounce } from "@/hooks/use-debounce";
import { CoinRow } from "./coin-row";
import { ScrollArea } from "../ui/scroll-area";
import { useSearchCoins } from "@/hooks/use-coins";

import { useAddUserCoin } from "@/store/user/hooks";

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
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectCoin?: (coin: Coin) => void;
}) {
  const defaultCoins = useDefaultCoins();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedQuery = useDebounce(searchQuery, 200);
  const [coinWarningModalOpen, setCoinWarningModalOpen] = useState(false);
  const [toWarningCoin, setToWarningCoin] = useState<Coin>();
  const searchCoins = useSearchCoins(debouncedQuery);

  const userCoinAdder = useAddUserCoin();

  const sortedCoins: Coin[] = useMemo(() => {
    const filteredCoins = Object.values(defaultCoins).filter(
      coinFilter(debouncedQuery)
    );

    return filteredCoins.sort((a, b) => {
      const [blockA] = a.id.split(":");
      const [blockB] = b.id.split(":");

      return Number(blockA) - Number(blockB);
    });
  }, [defaultCoins, debouncedQuery]);

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
    setSearchQuery(input);
  }, []);

  const handleConfirmCoin = () => {
    if (!toWarningCoin) {
      return;
    }
    onSelectCoin?.(toWarningCoin);
    userCoinAdder(toWarningCoin);
    setCoinWarningModalOpen(false);
    setOpen(false);
  };

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
            autoFocus={false}
            onChange={handleInput}
          />
        </div>
      </div>
      <ScrollArea
        className="border-t mt-4 h-[calc(70vh_-_80px)] focus:outline-none focus:ring-0"
        tabIndex={0}
      >
        {sortedCoins.map((coin, idx) => {
          return <CoinRow coin={coin} key={idx} onSelect={handleCoinSelect} />;
        })}
        {searchCoins?.length
          ? searchCoins.map((coin, idx) => (
              <CoinRow
                coin={coin}
                key={idx}
                onSelect={(coin) => handleCoinSelect(coin, true)}
              />
            ))
          : null}
      </ScrollArea>
      <CoinWarningModal
        open={coinWarningModalOpen}
        coin={toWarningCoin}
        onCancel={() => {
          setCoinWarningModalOpen(false);
        }}
        onConfirm={handleConfirmCoin}
      />
    </BaseModal>
  );
}
