"use client";

import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "../coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { Skeleton } from "../ui/skeleton";
import { formatNumber } from "@/lib/utils";

export function Footer() {
  const btcPrice = useCoinPrice(BITCOIN.id);

  return (
    <div className="hidden text-xs text-muted-foreground  sm:flex justify-end items-cetner fixed bottom-0 left-0 w-full border-t">
      <div className="flex items-center">
        <div className="px-4 py-2 border-r flex items-center gap-1">
          {btcPrice ? (
            <>
              <CoinIcon coin={BITCOIN} className="size-3" />
              <span>${formatNumber(btcPrice)}</span>
            </>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </div>
        <div className="px-4 py-2">2 sats/vb</div>
      </div>
    </div>
  );
}
