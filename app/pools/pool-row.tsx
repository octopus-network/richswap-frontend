import { DoubleIcon } from "@/components/double-icon";
import { Position, PoolInfo } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";

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
    Exchange.preWithdrawLiquidity(pool.key, address).then(setPosition);
  }, [pool, address]);

  const coinAPrice = useCoinPrice(position?.coinA?.id);
  const coinBPrice = useCoinPrice(position?.coinB?.id);

  const positionValue = useMemo(() => {
    return position === undefined
      ? undefined
      : position === null
      ? null
      : coinAPrice && coinBPrice
      ? new Decimal(coinAPrice)
          .mul(position.coinAAmount)
          .plus(new Decimal(coinBPrice).mul(position.coinBAmount))
          .toNumber()
      : undefined;
  }, [position, coinAPrice, coinBPrice]);

  const positionPercentage = useMemo(
    () =>
      positionValue && poolTvl
        ? new Decimal(positionValue * 100).div(poolTvl).toFixed(2)
        : positionValue === null
        ? null
        : undefined,
    [positionValue, poolTvl]
  );

  return (
    <>
      <div
        className="grid grid-cols-12 items-center gap-1 bg-secondary/80 hover:bg-secondary cursor-pointer px-4 py-3 rounded-2xl"
        onClick={() => setManageLiquidityModalOpen(true)}
      >
        <div className="col-span-4 flex items-center space-x-3">
          <div className="hidden sm:block">
            <DoubleIcon size="lg" coins={[pool.coinA, pool.coinB]} />
          </div>
          <span className="font-semibold text-lg hidden md:inline">
            {pool.coinA.symbol}/{pool.coinB.symbol}
          </span>
          <span className="font-semibold md:hidden">{pool.coinB.symbol}</span>
        </div>
        <div className="col-span-4 flex-col flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-xs md:text-sm">TVL</span>
          {poolTvl ? (
            <span className="font-semibold text-sm md:text-md">
              ${formatNumber(poolTvl)}
            </span>
          ) : (
            <Skeleton className="h-[18px] w-12 bg-slate-500/40" />
          )}
        </div>
        <div className="col-span-3 flex-col flex items-center justify-center space-y-1">
          <span className="text-muted-foreground text-sm">Your share</span>
          <>
            {positionPercentage === undefined ? (
              <Skeleton className="h-[18px] w-12 bg-slate-500/40" />
            ) : (
              <div className="flex items-center">
                {positionPercentage ? (
                  <>
                    <span className="font-semibold">{positionPercentage}%</span>
                    <span className="text-primary/80 text-xs ml-1">
                      ${formatNumber(positionValue ?? "0")}
                    </span>
                  </>
                ) : (
                  "-"
                )}
              </div>
            )}
          </>
        </div>
        <div className="col-span-1 flex justify-end">
          <ChevronRight className="size-5 text-muted-foreground" />
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
