"use client";

import { CreateButton } from "./create-button";
import { usePoolList, usePoolsFees, usePoolsTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolRow } from "./pool-row";
import { formatNumber } from "@/lib/utils";

export default function Pools() {
  const poolList = usePoolList();

  const poolsTvl = usePoolsTvl();
  const poolsFees = usePoolsFees();

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center h-9">
          <span className="text-2xl font-semibold">Pools</span>
          <div className="flex items-center gap-10">
            <div className="md:flex gap-6 hidden">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">TVL</span>
                {Object.keys(poolsTvl).length ? (
                  <span className="font-semibold">
                    $
                    {formatNumber(
                      Object.values(poolsTvl).reduce(
                        (total, curr) => total + curr,
                        0
                      )
                    )}
                  </span>
                ) : (
                  <Skeleton className="h-6 w-20" />
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">Fees</span>
                {Object.keys(poolsFees).length ? (
                  <span className="font-semibold">
                    $
                    {formatNumber(
                      Object.values(poolsFees).reduce(
                        (total, curr) => total + curr,
                        0
                      )
                    )}
                  </span>
                ) : (
                  <Skeleton className="h-6 w-20" />
                )}
              </div>
            </div>
            <CreateButton />
          </div>
        </div>
        <div className="mt-8 border rounded-xl">
          <div className="grid px-4 bg-secondary/40 text-sm rounded-t-xl md:grid-cols-12 grid-cols-8 items-center gap-1 py-3 text-muted-foreground">
            <div className="col-span-3">Pool</div>
            <div className="col-span-3 justify-center hidden md:flex">
              <span>TVL</span>
            </div>
            <div className="col-span-3 text-center">Your share</div>
            <div className="col-span-2 justify-center hidden md:flex">
              <span>Fees/TVL</span>
            </div>
            <div className="col-span-1" />
          </div>
          {poolList?.length ? (
            poolList.map((pool, idx) => <PoolRow pool={pool} key={idx} />)
          ) : (
            <Skeleton className="h-[66px] w-full rounded-none" />
          )}
        </div>
      </div>
    </div>
  );
}
