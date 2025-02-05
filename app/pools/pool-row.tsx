import { Position, PoolInfo } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";
import { useLaserEyes } from "@omnisat/lasereyes";

import Decimal from "decimal.js";
import { CoinIcon } from "@/components/coin-icon";

export function PoolRow({ pool }: { pool: PoolInfo }) {
  const [manageLiquidityModalOpen, setManageLiquidityModalOpen] =
    useState(false);

  const { address } = useLaserEyes();

  const [position, setPosition] = useState<Position | null>();

  const poolTvl = usePoolTvl(pool.key);

  useEffect(() => {
    if (!address) {
      setPosition(undefined);
    }
    Exchange.getPosition(pool, address).then(setPosition);
  }, [pool, address]);

  const positionPercentage = useMemo(
    () =>
      position
        ? new Decimal(position.userShare)
            .mul(100)
            .div(position.sqrtK)
            .toFixed(2)
        : position === null
        ? null
        : undefined,
    [position]
  );

  const positionValue = useMemo(() => {
    return positionPercentage === undefined
      ? undefined
      : positionPercentage === null
      ? null
      : poolTvl
      ? new Decimal(poolTvl).mul(positionPercentage).div(100).toNumber()
      : undefined;
  }, [poolTvl, positionPercentage]);

  return (
    <>
      <div
        className="grid md:grid-cols-12 grid-cols-8 h-[68px] items-center gap-1 bg-secondary/80 hover:bg-secondary cursor-pointer px-4 py-3 rounded-xl"
        onClick={() => setManageLiquidityModalOpen(true)}
      >
        <div className="col-span-4 flex items-center space-x-3">
          <div className="hidden sm:block">
            <CoinIcon size="lg" coin={pool.coinB} />
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold text-sm">{pool.name}</span>
            <span className="text-xs text-muted-foreground">
              {pool.coinB.id}
            </span>
          </div>
        </div>
        <div className="col-span-4 hidden flex-col md:flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-xs">TVL</span>
          {poolTvl ? (
            <span className="font-semibold text-sm md:text-md">
              ${formatNumber(poolTvl)}
            </span>
          ) : (
            <Skeleton className="h-[18px] w-12 bg-slate-500/40" />
          )}
        </div>
        <div className="col-span-3 flex-col flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-xs">Your share</span>
          <>
            {positionPercentage === undefined ? (
              <Skeleton className="h-[18px] w-12 bg-slate-500/40" />
            ) : (
              <div className="flex items-center">
                {positionPercentage ? (
                  <>
                    <span className="font-semibold">{positionPercentage}%</span>
                    {positionValue && (
                      <span className="text-primary/80 text-xs ml-1">
                        ${formatNumber(positionValue ?? "0")}
                      </span>
                    )}
                  </>
                ) : (
                  "-"
                )}
              </div>
            )}
          </>
        </div>
        <div className="col-span-1 flex justify-end">
          <ChevronRight className="size-4 md:size-5 text-muted-foreground" />
        </div>
      </div>
      <ManageLiquidityModal
        open={manageLiquidityModalOpen}
        pool={pool}
        position={position}
        setOpen={setManageLiquidityModalOpen}
      />
    </>
  );
}
