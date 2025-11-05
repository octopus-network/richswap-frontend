import { PoolInfo } from "@/types";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { usePoolApr, usePoolFee, usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

import { useCoinPrice } from "@/hooks/use-prices";

import { CoinIcon } from "@/components/coin-icon";
import { BITCOIN } from "@/lib/constants";
import Link from "next/link";
import { usePoolVolume } from "@/hooks/use-pools";

export function PoolRow({ pool }: { pool: PoolInfo }) {
  const poolTvl = usePoolTvl(pool.key);
  const poolApr = usePoolApr(pool.key);
  const poolFee = usePoolFee(pool.key);

  const poolVolumeInSats = usePoolVolume(pool.address);

  const btcPrice = useCoinPrice(BITCOIN.id);

  // const yieldTvl = useMemo(
  //   () =>
  //     poolTvl === 0
  //       ? 0
  //       : poolTvl !== undefined && poolFee !== undefined
  //       ? ((poolFee * 100) / poolTvl).toFixed(2)
  //       : undefined,
  //   [poolTvl, poolFee]
  // );

  const poolTvlInBtc = useMemo(
    () =>
      poolTvl !== undefined && btcPrice !== undefined
        ? poolTvl / btcPrice
        : btcPrice
        ? poolTvl ?? 0 / btcPrice
        : undefined,
    [btcPrice, poolTvl]
  );

  const poolFeeInBtc = useMemo(
    () =>
      poolFee !== undefined && btcPrice !== undefined
        ? poolFee / btcPrice
        : btcPrice
        ? poolFee ?? 0 / btcPrice
        : undefined,
    [btcPrice, poolFee]
  );

  const poolFeeInSats = useMemo(
    () =>
      poolFeeInBtc !== undefined ? poolFeeInBtc * Math.pow(10, 8) : undefined,
    [poolFeeInBtc]
  );

  const poolAddress = useMemo(() => pool.address, [pool]);

  const poolVolumeValue = useMemo(
    () =>
      poolVolumeInSats !== undefined && btcPrice !== undefined
        ? (poolVolumeInSats * btcPrice) / Math.pow(10, 8)
        : undefined,
    [poolVolumeInSats, btcPrice]
  );

  const poolFeeRate = useMemo(
    () => (pool.lpFeeRate + pool.protocolFeeRate) / 10000,
    [pool]
  );

  return (
    <>
      <Link href={`/pools/${poolAddress}`}>
        <div className="grid md:grid-cols-14 grid-cols-9 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 bg-secondary/20 hover:bg-secondary cursor-pointer px-4 py-3 transition-colors">
          <div className="col-span-4 flex items-center">
            <div className="hidden sm:block mr-3">
              <CoinIcon size="lg" coin={pool.coinB} />
            </div>
            <div className="hidden sm:inline-flex flex-col space-y-1 w-full group">
              <div className="flex w-full items-center space-x-1">
                <span className="font-semibold text-sm truncate max-w-[70%]">
                  {pool.name}
                </span>
                <span className="max-w-[25%] text-xs px-1 py-0.5 border border-primary/30 rounded-md text-primary">
                  {poolFeeRate.toFixed(2)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {pool.coinB.id}
              </span>
            </div>
            <div className="inline-flex sm:hidden flex-col space-y-1 w-full group">
              <div className="flex w-full items-center space-x-1">
                <span className="font-semibold text-sm truncate max-w-[85%]">
                  {pool.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {pool.coinB.id}
              </span>
            </div>
          </div>
          <div className="col-span-3">
            {poolTvl !== undefined && poolTvlInBtc !== undefined ? (
              <>
                <div className="hidden sm:inline-flex flex-col space-y-1">
                  <div className="flex w-full items-center space-x-1">
                    <span className="font-semibold text-sm truncate">
                      {formatNumber(poolTvlInBtc)} ₿
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    ${formatNumber(poolTvl, true)}
                  </span>
                </div>
                <div className="inline-flex sm:hidden flex-col space-y-1">
                  <div className="flex w-full items-center space-x-1">
                    <span className="font-semibold text-sm truncate">
                      {formatNumber(poolTvlInBtc)} ₿
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    ${formatNumber(poolTvl, true)}
                  </span>
                </div>
              </>
            ) : (
              <Skeleton className="h-5 w-20" />
            )}
          </div>
          <div className="col-span-2">
            {poolFee !== undefined && poolFeeInSats !== undefined ? (
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm truncate">
                  {formatNumber(poolFeeInSats, true)}{" "}
                  <em className="font-normal">sats</em>
                </span>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(poolFee, true)}
                </span>
              </div>
            ) : (
              <Skeleton className="h-5 w-20" />
            )}
          </div>
          <div className="col-span-2 hidden md:flex">
            {poolVolumeValue !== undefined && poolVolumeInSats !== undefined ? (
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-sm truncate">
                  {formatNumber(poolVolumeInSats, true)}{" "}
                  <em className="font-normal">sats</em>
                </span>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(poolVolumeValue, true)}
                </span>
              </div>
            ) : (
              <Skeleton className="h-5 w-20" />
            )}
          </div>
          <div className="col-span-2 hidden md:flex">
            {poolApr === undefined ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="flex gap-2 items-center">
                {poolApr ? (
                  <>
                    <span>
                      {Number(poolApr) === 0 ? "-" : `${poolApr.toFixed(2)}%`}
                    </span>
                  </>
                ) : (
                  "-"
                )}
              </div>
            )}
          </div>
          {/* <div className="col-span-2 hidden md:flex">
          {positionPercentage === undefined ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <div className="flex  space-y-1 flex-col">
              {positionPercentage ? (
                <>
                  <span className="font-semibold">
                    {formatNumber(positionPercentage)}%
                  </span>
                  {positionValue ? (
                    <span className="text-muted-foreground text-xs">
                      ${formatNumber(positionValue ?? "0", true)}
                    </span>
                  ) : null}
                </>
              ) : (
                "-"
              )}
            </div>
          )}
        </div> */}
          <div className="col-span-1 hidden md:flex justify-end">
            <ChevronRight className="size-4 md:size-5 text-muted-foreground" />
          </div>
        </div>
      </Link>
    </>
  );
}
