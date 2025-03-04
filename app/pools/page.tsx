"use client";

import { CreateButton } from "./create-button";
import { usePoolList, usePoolsFee, usePoolsTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoinPrice } from "@/hooks/use-prices";
import { BITCOIN } from "@/lib/constants";
import { PoolRow } from "./pool-row";
import { formatNumber } from "@/lib/utils";
import { useMemo } from "react";

export default function Pools() {
  const poolList = usePoolList();

  const poolsTvl = usePoolsTvl();
  const poolsFee = usePoolsFee();
  const btcPrice = useCoinPrice(BITCOIN.id);

  const totalPoolsTvl = useMemo(
    () => Object.values(poolsTvl).reduce((total, curr) => total + curr, 0),
    [poolsTvl]
  );

  const totalPoolsFee = useMemo(
    () => Object.values(poolsFee).reduce((total, curr) => total + curr, 0),
    [poolsFee]
  );

  const poolsTvlInBtc = useMemo(
    () =>
      btcPrice !== undefined
        ? totalPoolsTvl / btcPrice
        : btcPrice
        ? totalPoolsTvl / btcPrice
        : undefined,
    [btcPrice, totalPoolsTvl]
  );

  const poolsFeeInBtc = useMemo(
    () =>
      btcPrice !== undefined
        ? totalPoolsFee / btcPrice
        : btcPrice
        ? totalPoolsFee / btcPrice
        : undefined,
    [btcPrice, totalPoolsFee]
  );

  const poolsFeeInSats = useMemo(
    () =>
      poolsFeeInBtc !== undefined ? poolsFeeInBtc * Math.pow(10, 8) : undefined,
    [poolsFeeInBtc]
  );

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center">
          <span className="text-3xl font-semibold">Pools</span>
          <div className="flex items-center gap-10">
            <div className="md:flex gap-6 hidden">
              <div className="flex flex-col space-y-0.5">
                <span className="text-muted-foreground text-xs">TVL</span>
                {poolsTvlInBtc ? (
                  <span className="font-semibold">
                    {formatNumber(poolsTvlInBtc)} ₿
                  </span>
                ) : (
                  <Skeleton className="h-6 w-20" />
                )}
                {totalPoolsTvl ? (
                  <span className="text-xs text-muted-foreground">
                    ${formatNumber(totalPoolsTvl, true)}
                  </span>
                ) : (
                  <Skeleton className="h-4 w-12" />
                )}
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-muted-foreground text-xs">Fee</span>
                {poolsFeeInSats ? (
                  <span className="font-semibold">
                    {formatNumber(poolsFeeInSats, true)}{" "}
                    <em className="font-normal">sats</em>
                  </span>
                ) : (
                  <Skeleton className="h-6 w-20" />
                )}
                {totalPoolsFee ? (
                  <span className="text-xs text-muted-foreground">
                    ${formatNumber(totalPoolsFee, true)}
                  </span>
                ) : (
                  <Skeleton className="h-4 w-12" />
                )}
              </div>
            </div>
            <CreateButton />
          </div>
        </div>
        <div className="mt-6 flex flex-col space-y-2 md:hidden p-4 border bg-secondary/40 rounded-xl">
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVL</span>
            <div className="flex flex-col space-y-0.5 items-end">
              {poolsTvlInBtc ? (
                <span className="font-semibold">
                  {formatNumber(poolsTvlInBtc)} ₿
                </span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
              {totalPoolsTvl ? (
                <span className="text-xs text-muted-foreground">
                  ${formatNumber(totalPoolsTvl, true)}
                </span>
              ) : (
                <Skeleton className="h-4 w-12" />
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <div className="flex flex-col space-y-0.5 items-end">
              {poolsFeeInSats ? (
                <span className="font-semibold">
                  {formatNumber(poolsFeeInSats, true)}{" "}
                  <em className="font-normal">sats</em>
                </span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
              {totalPoolsFee ? (
                <span className="text-xs text-muted-foreground">
                  ${formatNumber(totalPoolsFee, true)}
                </span>
              ) : (
                <Skeleton className="h-4 w-12" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 border rounded-xl">
          <div className="grid px-4 bg-secondary/40 text-sm rounded-t-xl md:grid-cols-12 grid-cols-9 items-center gap-1 sm:gap-3 md:gap-6 py-3 text-muted-foreground">
            <div className="col-span-3">Pool</div>
            <div className="col-span-3">
              <span>TVL</span>
            </div>
            <div className="col-span-3">
              <span>Fee</span>
            </div>
            <div className="col-span-2 hidden md:flex">Your share</div>
            <div className="col-span-1 hidden md:flex" />
          </div>
          {poolList?.length
            ? poolList.map((pool, idx) => <PoolRow pool={pool} key={idx} />)
            : [1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="grid md:grid-cols-12 grid-cols-9 h-[66px] items-center gap-1 sm:gap-3 md:gap-6 px-4 py-3"
                >
                  <div className="col-span-3 flex items-center space-x-3">
                    <Skeleton className="size-10 rounded-full hidden sm:block" />
                    <div className="flex flex-col space-y-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                  <div className="col-span-3 flex">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <div className="col-span-3 hidden md:flex">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <div className="col-span-2 hidden md:flex">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
