import { DoubleIcon } from "@/components/double-icon";
import { PoolInfo } from "@/types";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";

export function PoolRow({ pool }: { pool: PoolInfo }) {
  const [manageLiquidityModalOpen, setManageLiquidityModalOpen] =
    useState(false);

  const poolTvl = usePoolTvl(pool.key);

  return (
    <>
      <div
        className="grid grid-cols-12 items-center gap-2 bg-secondary/80 hover:bg-secondary cursor-pointer px-4 py-3 rounded-2xl"
        onClick={() => setManageLiquidityModalOpen(true)}
      >
        <div className="col-span-4 flex items-center space-x-3">
          <DoubleIcon size="lg" coins={[pool.coinA, pool.coinB]} />
          <span className="font-semibold text-lg">
            {pool.coinA.symbol}/{pool.coinB.symbol}
          </span>
        </div>
        <div className="col-span-4 flex-col flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-sm">TVL</span>
          {poolTvl ? (
            <span className="font-semibold">${formatNumber(poolTvl)}</span>
          ) : (
            <Skeleton className="h-[18px] w-12 bg-slate-500/40" />
          )}
        </div>
        <div className="col-span-3 flex-col flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-sm">Your share</span>
          <span>-</span>
        </div>
        <div className="col-span-1 flex justify-end">
          <ChevronRight className="size-5 text-muted-foreground" />
        </div>
      </div>
      <ManageLiquidityModal
        open={manageLiquidityModalOpen}
        pool={pool}
        setOpen={setManageLiquidityModalOpen}
      />
    </>
  );
}
