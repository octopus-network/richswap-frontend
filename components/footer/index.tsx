"use client";

import Image from "next/image";
import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "../coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { Skeleton } from "../ui/skeleton";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { RUNESCAN_URL } from "@/lib/constants";
import { usePendingTxCount } from "@/hooks/use-pending-tx-count";
import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useTranslations } from "next-intl";

export function Footer() {
  const btcPrice = useCoinPrice(BITCOIN.id);
  const feeRate = useRecommendedFeeRateFromOrchestrator(true);
  const pendingTxCount = usePendingTxCount(true);
  const t = useTranslations("Footer");

  return (
    <div className="hidden items-center md:flex bg-background text-sm text-muted-foreground justify-between items-cetner fixed bottom-0 left-0 w-full border-t">
      <Link href={RUNESCAN_URL} target="_blank">
        <Image
          src="/static/icons/powered-by-ree.png"
          width={482}
          height={110}
          className="w-32"
          alt="Powered by REE"
        />
      </Link>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-4 py-2 flex items-center space-x-1.5 cursor-pointer">
              {pendingTxCount < 10 ? (
                <>
                  <span className="size-2 bg-green-500 rounded-full block" />
                  <span className="text-green-500">{t("fluent")}</span>
                </>
              ) : pendingTxCount < 24 ? (
                <>
                  <span className="size-2 bg-yellow-500 rounded-full block" />
                  <span className="text-yellow-500">{t("busy")}</span>
                </>
              ) : (
                <>
                  <span className="size-2 bg-red-500 rounded-full block" />
                  <span className="text-red-500">{t("congested")}</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {pendingTxCount} {t("pendingTransactions")}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
