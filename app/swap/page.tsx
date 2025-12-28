"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from "react";
import { SwapPanel } from "./swap-panel";

import { useTranslations } from "next-intl";
import { cn, formatNumber } from "@/lib/utils";
import { KlineChart } from "./kline-chart";
import { Coin } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useKlineChartOpen } from "@/store/user/hooks";
import { RunePriceData, useRunePrice } from "@/hooks/use-rune-price";
import Link from "next/link";
import { BITCOIN, RUNESCAN_URL } from "@/lib/constants";

import { useCoinPrice } from "@/hooks/use-prices";
import { Separator } from "@/components/ui/separator";
import { usePoolList } from "@/hooks/use-pools";
import TradingActivity from "./trading-activity";
import { useHolders } from "@/hooks/use-holders";

function Overview({
  rune,
  priceData,
}: {
  rune: Coin | undefined;
  priceData: RunePriceData | null;
}) {
  const t = useTranslations("Swap");
  const btcPrice = useCoinPrice(BITCOIN.id);

  const { data: holders } = useHolders({
    runeId: rune?.id,
    refreshInterval: 60 * 1000,
  });

  return (
    <div>
      <div className="px-2 py-1.5 flex justify-between items-center">
        <div className="flex items-center gap-2 h-10">
          {rune ? (
            <div className="flex space-x-2 items-center">
              <CoinIcon coin={rune} />
              <span className="font-semibold">{rune.name}</span>
            </div>
          ) : (
            <div className="flex space-x-2 items-center">
              <Skeleton className="size-8 rounded-full bg-slate-50/20" />
              <Skeleton className="h-6 w-32 bg-slate-50/20" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          {rune ? (
            <Link href={`${RUNESCAN_URL}/runes/${rune.name}`} target="_blank">
              <div className="flex items-center text-muted-foreground hover:text-foreground hover:underline cursor-pointer">
                <span className="text-sm">{rune.id}</span>
                <ExternalLink className="size-3 ml-1" />
              </div>
            </Link>
          ) : (
            <Skeleton className="h-5 w-20 bg-slate-50/20" />
          )}
        </div>
      </div>
      <Separator className="bg-slate-50/5" />
      <div className="px-2 py-1.5 flex space-x-6 items-start">
        {priceData && priceData.hasData ? (
          <div className="flex-col flex">
            <span className="text-sm font-semibold">
              {formatNumber(priceData.price)} sats
            </span>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xs",
                  priceData.change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {priceData.change > 0
                  ? `+${priceData.change.toFixed(2)}`
                  : priceData.change.toFixed(2)}
                %
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-col flex">
            <Skeleton className="h-4 w-16 mb-1 bg-slate-50/20" />
            <Skeleton className="h-3 w-12 bg-slate-50/20" />
          </div>
        )}

        <div className="flex-col flex">
          <span className="text-xs text-muted-foreground">
            {t("marketCap")}
          </span>
          {priceData && priceData.hasData ? (
            <div className="flex sm:items-center space-x-1 flex-col sm:flex-row">
              <span className="text-sm font-semibold">
                {formatNumber(priceData.market_cap / 1e8)} ₿
              </span>
              <span className="text-xs text-muted-foreground">
                (${formatNumber((priceData.market_cap * btcPrice) / 1e8)})
              </span>
            </div>
          ) : (
            <Skeleton className="h-4 w-20 bg-slate-50/20" />
          )}
        </div>
        <div className="flex-col flex">
          <span className="text-xs text-muted-foreground">{t("tvl")}</span>
          {priceData && priceData.hasData ? (
            <div className="flex sm:items-center space-x-1 flex-col sm:flex-row">
              <span className="text-sm font-semibold">
                {formatNumber(priceData.tvl / 1e8)} ₿
              </span>
              <span className="text-xs text-muted-foreground">
                (${formatNumber((priceData.tvl * btcPrice) / 1e8)})
              </span>
            </div>
          ) : (
            <Skeleton className="h-4 w-20 bg-slate-50/20" />
          )}
        </div>
        <div className="flex-col flex">
          <span className="text-xs text-muted-foreground">{t("holders")}</span>
          {holders ? (
            <div className="flex sm:items-center gap-2 flex-col sm:flex-row">
              <span className="text-sm font-semibold">{holders}</span>
              <Link
                target="_blank"
                className="inline-flex items-center text-muted-foreground underline hover:text-foreground"
                href={`${RUNESCAN_URL}/runes/${rune?.name}?tab=Holder&page=1`}
              >
                <span className="text-xs">View on Explorer</span>
                <ExternalLink className="size-3 ml-1" />
              </Link>
            </div>
          ) : (
            <Skeleton className="h-4 w-20 bg-slate-50/20" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  const poolList = usePoolList();

  const [rune, setRune] = useState<Coin>();
  const [chartLoading, setChartLoading] = useState(true);

  const klineChartOpen = useKlineChartOpen();

  const { priceData } = useRunePrice(rune?.name || null, {
    refreshInterval: 60 * 1000,
    enabled: klineChartOpen && !!rune?.name,
  });

  useEffect(() => {
    if (rune?.name) {
      setChartLoading(true);
    }
  }, [rune?.name]);

  const poolInfo = useMemo(() => {
    return poolList.find((pool) => pool.coinB.id === rune?.id);
  }, [poolList, rune?.id]);

  const t = useTranslations("Swap");

  return (
    <Suspense>
      <div className="lg:pt-12 w-full flex flex-col items-center">
        <div className="w-full flex flex-col-reverse lg:flex-row justify-center items-center lg:items-start max-w-7xl gap-6">
          {klineChartOpen && (
            <div className="flex-1 flex flex-col w-full max-w-lg lg:max-w-full gap-6">
              <div
                key="chart"
                className="bg-secondary/60 rounded-xl flex flex-col"
              >
                <Overview rune={rune} priceData={priceData} />
                <div className="h-[260px] lg:h-[420px] relative">
                  {(chartLoading || !poolInfo) && (
                    <div className="absolute inset-0 bg-secondary items-center justify-center flex">
                      <Loader2 className="size-6 text-muted-foreground animate-spin" />
                    </div>
                  )}
                  {poolInfo?.paused ? (
                    <div className="absolute inset-0 bg-secondary items-center justify-center flex">
                      <span className="text-muted-foreground">
                        {t("marketOpeningSoon")}
                      </span>
                    </div>
                  ) : (
                    <KlineChart
                      rune={rune?.name || ""}
                      onLoadingChange={setChartLoading}
                    />
                  )}
                </div>
              </div>
              <TradingActivity
                rune={rune?.name || ""}
                poolAddress={poolInfo?.address || ""}
              />
            </div>
          )}
          <div className="max-w-[480px] w-full">
            <SwapPanel onRuneChange={setRune} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
