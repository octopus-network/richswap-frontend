"use client";

import { RefreshCcw, ChartLine, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { SwapPanel } from "./swap-panel";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { KlineChart } from "./kline-chart";
import { Coin } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";

export default function SwapPage() {
  const t = useTranslations("Swap");
  const [showChart, setShowChart] = useState(true);
  const [removeChartMask, setRemoveShowChartMask] = useState(false);
  const [rune, setRune] = useState<Coin>();

  useEffect(() => {
    setRemoveShowChartMask(false);
  }, [rune, showChart]);

  return (
    <Suspense>
      <div className="md:pt-12 w-full flex flex-col items-center">
        <div className="w-full flex flex-col md:flex-row justify-center items-center md:items-start max-w-7xl gap-6">
          {showChart && (
            <div
              key="chart"
              className="flex-1 w-full max-w-lg md:max-w-full overflow-hidden bg-secondary rounded-lg fle flex-col"
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {rune ? (
                    <>
                      <CoinIcon coin={rune} />
                      <span className="font-semibold">{rune.name}</span>
                    </>
                  ) : (
                    <>
                      <Skeleton className="size-8 rounded-full bg-slate-50/20" />
                      <Skeleton className="h-6 w-20 bg-slate-50/20" />
                    </>
                  )}
                </div>
              </div>
              <div className="h-[260px] md:h-[420px] relative">
                {!removeChartMask && (
                  <div className="absolute inset-0 bg-secondary items-center justify-center flex">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  </div>
                )}
                <KlineChart
                  rune={rune?.name || ""}
                  onChartReady={() => setRemoveShowChartMask(true)}
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
                    showChart
                      ? "border-primary text-primary"
                      : "hover:text-primary"
                  )}
                  variant="secondary"
                  onClick={() => setShowChart((prev) => !prev)}
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
