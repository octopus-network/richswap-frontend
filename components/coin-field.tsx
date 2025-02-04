"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Coin } from "@/types";
import { CoinIcon } from "./coin-icon";
import { SelectCoinModal } from "./select-coin-modal";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useCoinBalance } from "@/hooks/use-balance";
import { Wallet } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Decimal from "decimal.js";

import { getCoinSymbol, getCoinName } from "@/lib/utils";

const CoinButton = ({
  coin,
  onClick,
}: {
  coin: Coin | null;
  onClick: () => void;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <Button
      variant="secondary"
      className="group h-11 px-2 border border-transparent hover:border-primary/80 hover:bg-primary/10"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-36 sm:w-40 justify-between">
        {coin ? (
          <div className="flex gap-2 items-center w-[calc(100%_-_24px)]">
            <CoinIcon coin={coin} />
            <div className="flex flex-col text-left w-[calc(100%_-_32px)]">
              <span className="truncate font-semibold">
                {getCoinSymbol(coin)}
              </span>
              <span className="text-xs w-full text-muted-foreground font-normal truncate">
                {getCoinName(coin)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-center w-[calc(100%_-_24px)]">
            <div className="size-7 rounded-full bg-[#373c44] flex items-center justify-center">
              <Image
                src="/static/icons/select-coin.svg"
                alt="Select Coin"
                className="size-5"
                width={64}
                height={64}
              />
            </div>
            <span className="text-sm flex-1 truncate font-semibold">
              Select Coin
            </span>
          </div>
        )}
        <ChevronDown className="text-muted-foreground group-hover:text-foreground size-4" />
      </div>
    </Button>
  ) : (
    <Skeleton className="h-10 w-32 rounded-lg" />
  );
};

export function CoinField({
  label,
  onSelectCoin,
  className,
  autoFocus,
  pulsing,
  fiatValue,
  value,
  coin,
  onUserInput,
}: {
  label: string;
  coin: Coin | null;
  className?: string;
  autoFocus?: boolean;
  pulsing?: boolean;
  value: string;
  fiatValue?: number;
  onSelectCoin?: (coin: Coin) => void;
  onUserInput: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectCoinModalOpen, setSelectCoinModalOpen] = useState(false);
  const { address } = useLaserEyes();
  const balance = useCoinBalance(address, coin?.id);

  const onSetHalf = () => {
    onUserInput(
      new Decimal(balance!).mul(0.5).toDecimalPlaces(coin?.decimals).toFixed()
    );
  };

  const onSetMax = () => {
    // const minimumReserveAmount =
    //   coin === BITCOIN ? new Decimal(0.0001) : new Decimal(0);
    const minimumReserveAmount = new Decimal(0);
    onUserInput(
      Decimal.max(
        new Decimal(balance!).sub(minimumReserveAmount),
        new Decimal(0)
      ).toFixed()
    );
  };

  return (
    <>
      <div
        className={cn(
          "bg-card hover:bg-card/60 hover:border-primary/30 hover:focus-within:border-primary/60 px-4 py-2 rounded-xl focus-within:border-primary/80 focus-within:shadow-swap-input border border-transparent transition-colors duration-200",
          className,
          pulsing && "animate-pulse duration-600"
        )}
        onClick={() => {
          inputRef?.current?.focus();
        }}
      >
        <div className="flex justify-between h-9 items-center">
          <span className="text-sm">{label}</span>
          {address && coin && (
            <div className="flex space-x-2 items-center">
              {balance === undefined ? (
                <Skeleton className="w-24 h-6" />
              ) : (
                <>
                  <div className="flex items-center text-muted-foreground">
                    <Wallet className="size-3" />
                    <span className="font-medium text-xs ml-1">
                      {formatNumber(balance)} {coin?.symbol}
                    </span>
                  </div>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={onSetHalf}
                    className="text-muted-foreground hover:text-foreground uppercase"
                  >
                    Half
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={onSetMax}
                    className="text-muted-foreground hover:text-foreground uppercase"
                  >
                    Max
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex mt-2 mb-2 h-[41px] gap-2 items-center">
          {onSelectCoin ? (
            <CoinButton
              coin={coin}
              onClick={() => setSelectCoinModalOpen(true)}
            />
          ) : (
            <div className="flex gap-2 items-center w-[calc(100%_-_24px)]">
              <CoinIcon coin={coin!} />
              <div className="flex flex-col text-left w-[calc(100%_-_32px)]">
                <span className="truncate">{coin!.symbol}</span>
                <span className="text-xs w-full text-muted-foreground font-normal truncate">
                  {coin!.name}
                </span>
              </div>
            </div>
          )}
          <div className="flex h-full text-right flex-col w-full">
            <Input
              type="number"
              placeholder="0.00"
              ref={inputRef}
              autoFocus={autoFocus}
              onChange={(e) => onUserInput(e.target.value)}
              value={value}
              className="border-none rounded-none p-0 h-full w-full font-bold text-right text-xl md:text-xl focus:outline-none"
            />
            {fiatValue ? (
              <span className="text-muted-foreground text-xs">
                ${formatNumber(fiatValue)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <SelectCoinModal
        open={selectCoinModalOpen}
        setOpen={setSelectCoinModalOpen}
        onSelectCoin={onSelectCoin}
      />
    </>
  );
}
