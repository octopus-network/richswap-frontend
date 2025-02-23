import { Position, PoolInfo } from "@/types";
import { Exchange } from "@/lib/exchange";
import { useEffect, useState, useMemo } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { usePoolFee, usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, getP2trAressAndScript } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useCoinPrice } from "@/hooks/use-prices";

import Decimal from "decimal.js";
import { CoinIcon } from "@/components/coin-icon";
import { BITCOIN } from "@/lib/constants";

export function PoolRow({ pool }: { pool: PoolInfo }) {
  const [manageLiquidityModalOpen, setManageLiquidityModalOpen] =
    useState(false);

  const { paymentAddress } = useLaserEyes();

  const [position, setPosition] = useState<Position | null>();

  const poolTvl = usePoolTvl(pool.key);
  const poolFee = usePoolFee(pool.key);

  const btcPrice = useCoinPrice(BITCOIN.id);

  useEffect(() => {
    if (!paymentAddress) {
      setPosition(undefined);
    }
    Exchange.getPosition(pool, paymentAddress).then(setPosition);
  }, [pool, paymentAddress]);

  const positionPercentage = useMemo(
    () =>
      position
        ? new Decimal(position.userShare)
            .mul(100)
            .div(position.sqrtK)
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
      ? null
      : poolTvl
      ? new Decimal(poolTvl).mul(positionPercentage).div(100).toNumber()
      : undefined;
  }, [poolTvl, positionPercentage]);

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

  const poolAddress = useMemo(() => {
    const { address } = getP2trAressAndScript(pool.key);
    return address;
  }, [pool]);
  return (
    <>
      <div
        className="grid md:grid-cols-12 grid-cols-9 h-[66px] items-center gap-1 sm:gap-3 md:gap-6 hover:bg-secondary cursor-pointer px-4 py-3"
        onClick={() => setManageLiquidityModalOpen(true)}
      >
        <div className="col-span-3 flex items-center">
          <div className="hidden sm:block mr-3">
            <CoinIcon size="lg" coin={pool.coinB} />
          </div>
          <div
            className="hidden sm:inline-flex flex-col space-y-1 w-full group"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(
                `https://mempool.space/address/${poolAddress}`,
                "_blank"
              );
            }}
          >
            <div className="flex w-full items-center space-x-1 group-hover:underline">
              <span className="font-semibold text-sm truncate max-w-[85%]">
                {pool.name}
              </span>
              <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
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
                    {formatNumber(poolTvlInBtc)} ₿
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(poolTvl)}
                </span>
              </div>
              <div className="inline-flex sm:hidden flex-col space-y-1">
                <div className="flex w-full items-center space-x-1">
                  <span className="font-semibold text-sm truncate">
                    {formatNumber(poolTvlInBtc)} ₿
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(poolTvl)}
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-3">
          {poolFee !== undefined && poolFeeInBtc !== undefined ? (
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-sm truncate">
                {formatNumber(poolFeeInBtc)} ₿
              </span>
              <span className="text-muted-foreground text-xs">
                ${formatNumber(poolFee)}
              </span>
            </div>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-2 hidden md:flex">
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
                      ${formatNumber(positionValue ?? "0")}
                    </span>
                  ) : null}
                </>
              ) : (
                "-"
              )}
            </div>
          )}
        </div>
        <div className="col-span-1 hidden md:flex justify-end">
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
