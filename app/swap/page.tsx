"use client";

import { RefreshCcw, ChartLine, ExternalLink } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { SwapPanel } from "./swap-panel";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn, formatNumber } from "@/lib/utils";
import { KlineChart } from "./kline-chart";
import { Coin } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useKlineChartOpen, useToggleKlineChartOpen } from "@/store/user/hooks";
import Link from "next/link";
import { RUNESCAN_URL } from "@/lib/constants";

export default function SwapPage() {
  const t = useTranslations("Swap");
  const klineChartOpen = useKlineChartOpen();
  const toggleKlineChartOpen = useToggleKlineChartOpen();

  const [rune, setRune] = useState<Coin>();
  const [latestPrice, setLatestPrice] = useState<{
    price: number;
    change: number;
  } | null>(null);

  useEffect(() => {
    setLatestPrice(null);
  }, [rune]);

  return (
    <Suspense>
      <div className="lg:pt-12 w-full flex flex-col items-center">
        <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:items-start max-w-7xl gap-6">
          {klineChartOpen && (
            <div
              key="chart"
              className="flex-1 w-full max-w-lg lg:max-w-full overflow-hidden bg-secondary/80 rounded-xl fle flex-col"
            >
              <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {rune ? (
                    <>
                      <CoinIcon coin={rune} />

                      <div className="flex flex-col">
                        <span className="font-semibold">{rune.name}</span>
                        <Link
                          href={`${RUNESCAN_URL}/runes/${rune.name}`}
                          target="_blank"
                        >
                          <div className="flex items-center text-muted-foreground hover:text-foreground hover:underline cursor-pointer">
                            <span className="text-xs">{rune.id}</span>
                            <ExternalLink className="size-3 ml-1" />
                          </div>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <Skeleton className="size-8 rounded-full bg-slate-50/20" />
                      <Skeleton className="h-7 w-20 bg-slate-50/20" />
                    </>
                  )}
                </div>
                {latestPrice && (
                  <div className="flex-col flex items-end">
                    <span className="text-sm font-semibold">
                      {formatNumber(latestPrice.price)} sats
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        latestPrice.change >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {latestPrice.change > 0
                        ? `+${latestPrice.change.toFixed(2)}`
                        : latestPrice.change.toFixed(2)}
                      %
                    </span>
                  </div>
                )}
              </div>
              <div className="h-[260px] lg:h-[420px] relative">
                {/* {!removeChartMask && (
                  <div className="absolute inset-0 bg-secondary items-center justify-center flex">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  </div>
                )} */}
                <KlineChart
                  rune={rune?.name || ""}
                  onChartReady={(price) => {
                    setLatestPrice(price);
                  }}
                />
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
                  <RefreshCcw className="size-4" />
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
