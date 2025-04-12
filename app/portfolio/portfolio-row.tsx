import { Position } from "@/types";

import { useState, useMemo } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";

import { useCoinPrice } from "@/hooks/use-prices";

import Decimal from "decimal.js";
import { CoinIcon } from "@/components/coin-icon";
import { BITCOIN } from "@/lib/constants";

export function PortfolioRow({ position }: { position: Position }) {
  const [manageLiquidityModalOpen, setManageLiquidityModalOpen] =
    useState(false);

  const poolTvl = usePoolTvl(position.pool.key);

  const btcPrice = useCoinPrice(BITCOIN.id);

  const positionPercentage = useMemo(
    () =>
      position
        ? new Decimal(position.userShare)
            .mul(100)
            .div(position.totalShare)
            .toFixed(4)
        : position === null
        ? null
        : undefined,
    [position]
  );

  const positionValue = useMemo(() => {
    return positionPercentage === undefined
      ? undefined
      : positionPercentage === null
      ? undefined
      : poolTvl
      ? new Decimal(poolTvl).mul(positionPercentage).div(100).toNumber()
      : undefined;
  }, [poolTvl, positionPercentage]);

  const positionValueInBtc = useMemo(
    () =>
      positionValue !== undefined && btcPrice !== undefined
        ? positionValue / btcPrice
        : btcPrice
        ? positionValue ?? 0 / btcPrice
        : undefined,
    [btcPrice, positionValue]
  );

  const positionYield = useMemo(
    () => (position ? position.userIncomes : undefined),
    [position]
  );

  const positionYieldValue = useMemo(
    () =>
      positionYield && btcPrice
        ? new Decimal(positionYield)
            .mul(btcPrice)
            .div(Math.pow(10, 8))
            .toNumber()
        : undefined,
    [positionYield, btcPrice]
  );

  const poolAddress = useMemo(() => position.pool.address, [position]);

  return (
    <>
      <div
        className="grid grid-cols-10 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 bg-secondary/20 hover:bg-secondary cursor-pointer px-4 py-3 transition-colors"
        onClick={() => setManageLiquidityModalOpen(true)}
      >
        <div className="col-span-3 flex items-center">
          <div className="hidden sm:block mr-3">
            <CoinIcon size="lg" coin={position.pool.coinB} />
          </div>
          <div
            className="hidden sm:inline-flex flex-col space-y-1 w-full group"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(
                `https://www.runescan.net/runes/${position.pool.coinB.number}`,
                "_blank"
              );
            }}
          >
            <div className="flex w-full items-center space-x-1 group-hover:underline">
              <span className="font-semibold text-sm truncate max-w-[85%]">
                {position.pool.name}
              </span>
              <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {position.pool.coinB.id}
            </span>
          </div>
          <div className="inline-flex sm:hidden flex-col space-y-1 w-full group">
            <div className="flex w-full items-center space-x-1">
              <span className="font-semibold text-sm truncate max-w-[85%]">
                {position.pool.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {position.pool.coinB.id}
            </span>
          </div>
        </div>
        <div className="col-span-3">
          {positionValue !== undefined && positionValueInBtc !== undefined ? (
            <>
              <div
                className="hidden sm:inline-flex flex-col space-y-1 group"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(
                    `https://www.runescan.net/address/${poolAddress}`,
                    "_blank"
                  );
                }}
              >
                <div className="flex w-full items-center space-x-1 group-hover:underline">
                  <span className="font-semibold text-sm truncate">
                    {formatNumber(positionValueInBtc)} ₿
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(positionValue, true)}
                </span>
              </div>
              <div className="inline-flex sm:hidden flex-col space-y-1">
                <div className="flex w-full items-center space-x-1">
                  <span className="font-semibold text-sm truncate">
                    {formatNumber(positionValueInBtc)} ₿
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(positionValue, true)}
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-3">
          {positionYieldValue !== undefined && positionYield !== undefined ? (
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-sm truncate">
                {formatNumber(positionYield, true)}{" "}
                <em className="font-normal">sats</em>
              </span>
              <span className="text-muted-foreground text-xs">
                ${formatNumber(positionYieldValue, true)}
              </span>
            </div>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-1 hidden md:flex justify-end">
          <ChevronRight className="size-4 md:size-5 text-muted-foreground" />
        </div>
      </div>
      <ManageLiquidityModal
        open={manageLiquidityModalOpen}
        position={position}
        pool={position.pool}
        setOpen={setManageLiquidityModalOpen}
      />
    </>
  );
}
