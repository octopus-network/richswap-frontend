"use client";

import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "../coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { Skeleton } from "../ui/skeleton";
import { formatNumber } from "@/lib/utils";

import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";

export function Footer() {
  
  const btcPrice = useCoinPrice(BITCOIN.id);
  const feeRate = useRecommendedFeeRateFromOrchestrator(true);

  return (
    <div className="hidden md:flex bg-background text-sm text-muted-foreground justify-end items-cetner fixed bottom-0 left-0 w-full border-t">
      <div className="flex items-center">
        <div className="px-4 py-2 border-r flex items-center gap-1">
          {btcPrice ? (
            <>
              <CoinIcon coin={BITCOIN} className="size-4" />
              <span>${formatNumber(btcPrice)}</span>
            </>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="px-4 py-2 border-r">
          {feeRate === undefined ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            `${feeRate} sats/vb`
          )}
        </div>
      </div>
    </div>
  );
}