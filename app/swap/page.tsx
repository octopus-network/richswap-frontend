"use client";

import { RefreshCcw, ChartLine } from "lucide-react";
import { Suspense, useState } from "react";
import { SwapPanel } from "./swap-panel";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { KlineChart } from "./kline-chart";

export default function SwapPage() {
  const t = useTranslations("Swap");
  const [showChart, setShowChart] = useState(false);
  return (
    <Suspense>
      <div className="md:pt-12 w-full flex flex-col items-center">
        <div className="w-full flex flex-col sm:flex-row justify-center items-center max-w-6xl gap-6">
          {showChart && (
            <div
              key="chart"
              className="flex-1 overflow-hidden bg-secondary rounded-lg flex h-[400px] flex-col"
            >
              <div className="bg-black">
                dsadsadsa
              </div>
              <div className="flex-1 min-h-[200px] h-full">
                <KlineChart />
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
            <SwapPanel />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
