"use client";

import { RefreshCcw, ChartLine, ExternalLink } from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from "react";
import { SwapPanel } from "./swap-panel";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn, formatNumber } from "@/lib/utils";
import { KlineChart } from "./kline-chart";
import { Coin } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useKlineChartOpen, useToggleKlineChartOpen } from "@/store/user/hooks";
import { RunePriceData, useRunePrice } from "@/hooks/use-rune-price";
import Link from "next/link";
import { RUNESCAN_URL } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePoolList } from "@/hooks/use-pools";

function Overview({
  rune,
  priceData,
}: {
  rune: Coin | undefined;
  priceData: RunePriceData | null;
}) {
  const t = useTranslations("Swap");
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
      <div className="px-2 py-1.5 h-12 flex space-x-6 items-start">
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
            <span className="text-sm font-semibold">
              {formatNumber(priceData.market_cap / 1e8)} ₿
            </span>
          ) : (
            <Skeleton className="h-4 w-12 bg-slate-50/20" />
          )}
        </div>
        <div className="flex-col flex">
          <span className="text-xs text-muted-foreground">{t("tvl")}</span>
          {priceData && priceData.hasData ? (
            <span className="text-sm font-semibold">
              {formatNumber(priceData.tvl / 1e8)} ₿
            </span>
          ) : (
            <Skeleton className="h-4 w-12 bg-slate-50/20" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  const t = useTranslations("Swap");
  const klineChartOpen = useKlineChartOpen();
  const toggleKlineChartOpen = useToggleKlineChartOpen();

  const poolList = usePoolList();

  const [rune, setRune] = useState<Coin>();
  const [chartLoading, setChartLoading] = useState(true);

  const { priceData } = useRunePrice(rune?.name || null, {
    refreshInterval: 30000,
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

  return (
    <Suspense>
      <div className="lg:pt-12 w-full flex flex-col items-center">
        <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:items-start max-w-7xl gap-6">
          {klineChartOpen && (
            <div
              key="chart"
              className="flex-1 w-full max-w-lg lg:max-w-full overflow-hidden bg-secondary/60 rounded-xl fle flex-col"
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
          )}
          <div className="max-w-lg w-full">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-semibold">{t("swap")}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className={cn(
                    "rounded-full size-8 text-muted-foreground border border-transparent",
                    klineChartOpen
                      ? "border-primary text-primary"
                      : "hover:text-primary"
                  )}
                  variant="secondary"
                  onClick={() => toggleKlineChartOpen()}
                >
                  <ChartLine className="size-4" />
                </Button>
                <Button
                  size="icon"
                  className="rounded-full size-8 text-muted-foreground hover:text-foreground"
                  variant="secondary"
                >
                  <RefreshCcw className={cn("size-4")} />
                </Button>
              </div>
            </div>
            <SwapPanel onRuneChange={setRune} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
