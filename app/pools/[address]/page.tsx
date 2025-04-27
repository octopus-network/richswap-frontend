"use client";

import Link from "next/link";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoolList } from "@/hooks/use-pools";
import { useParams } from "next/navigation";
import { Position } from "@/types";
import { useMemo, useEffect, useState } from "react";
import { Exchange } from "@/lib/exchange";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useLaserEyes } from "@omnisat/lasereyes";
import { ExternalLink } from "lucide-react";
import { usePoolTvl, usePoolFee } from "@/hooks/use-pools";
import { useCoinPrice } from "@/hooks/use-prices";
import { BITCOIN, RUNESCAN_URL } from "@/lib/constants";
import { ellipseMiddle, formatNumber } from "@/lib/utils";
import Circle from "react-circle";

import { formatCoinAmount, getCoinSymbol } from "@/lib/utils";
import { ManageLiquidityPanel } from "./manage-liquidity-panel";

export default function Pool() {
  const poolList = usePoolList();

  const { address } = useParams();

  const { paymentAddress } = useLaserEyes((x) => ({
    paymentAddress: x.paymentAddress,
  }));

  const [position, setPosition] = useState<Position | null>();

  const [lps, setLps] = useState<any[]>([]);

  useEffect(() => {
    Exchange.getLps(address as string).then(setLps);
  }, [address]);

  const poolInfo = useMemo(
    () => poolList.find((pool) => pool.address === address),
    [address, poolList]
  );

  const btcPrice = useCoinPrice(BITCOIN.id);

  const poolTvl = usePoolTvl(poolInfo?.key);

  const poolTvlInBtc = useMemo(
    () =>
      poolTvl !== undefined && btcPrice !== undefined
        ? poolTvl / btcPrice
        : btcPrice
        ? poolTvl ?? 0 / btcPrice
        : undefined,
    [btcPrice, poolTvl]
  );

  const poolFee = usePoolFee(poolInfo?.key);

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

  useEffect(() => {
    if (!paymentAddress || !poolInfo) {
      setPosition(undefined);
      return;
    }
    Exchange.getPosition(poolInfo, paymentAddress).then(setPosition);
  }, [poolInfo, paymentAddress]);

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="justify-between flex">
          <div className="flex items-center gap-2">
            {poolInfo ? (
              <>
                <Link href="/pools">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">{poolInfo.name}</span>
                </div>
              </>
            ) : (
              <Skeleton className="h-9 w-48" />
            )}
          </div>
          {poolInfo && (
            <Link
              href={`/swap?coinA=${getCoinSymbol(
                poolInfo.coinA ?? null
              )}&coinB=${getCoinSymbol(poolInfo.coinB ?? null)}`}
              className="text-primary/80 hover:text-primary ml-3 inline-flex items-center"
            >
              <ArrowLeftRight className="mr-1 size-4" /> Swap
            </Link>
          )}
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-5 md:grid-cols-9 gap-4">
            <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-5">
              {poolInfo ? (
                <ManageLiquidityPanel pool={poolInfo} position={position} />
              ) : (
                <div className="flex flex-col">
                  <Skeleton className="w-full h-60" />
                  <Skeleton className="w-full h-10 mt-6 rounded-xl" />
                </div>
              )}
            </div>
            <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-5 md:col-span-4 ">
              <div className="font-semibold text-lg">Pool Info</div>
              <div className="mt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rune</span>
                  {poolInfo ? (
                    <div className="flex items-center gap-1">
                      <CoinIcon coin={poolInfo.coinB} size="sm" />
                      <Link
                        href={`${RUNESCAN_URL}/runes/${poolInfo.name}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 group hover:underline"
                      >
                        <span>{poolInfo.name}</span>
                        <ExternalLink className="text-muted-foreground size-3 group-hover:text-foreground" />
                      </Link>
                    </div>
                  ) : (
                    <Skeleton className="h-6 w-24" />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVL</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolTvlInBtc ? (
                      <Link
                        href={`${RUNESCAN_URL}/exchange/RICH_SWAP/pool/${poolInfo?.address}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 group hover:underline"
                      >
                        <span>{formatNumber(poolTvlInBtc)} ₿</span>
                        <ExternalLink className="text-muted-foreground size-3 group-hover:text-foreground" />
                      </Link>
                    ) : (
                      <Skeleton className="h-6 w-24" />
                    )}
                    {poolTvl ? (
                      <span className="text-muted-foreground truncate">
                        ${formatNumber(poolTvl)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-12" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolFeeInSats !== undefined ? (
                      <span>{formatNumber(poolFeeInSats, true)} sats</span>
                    ) : (
                      <Skeleton className="h-6 w-24" />
                    )}
                    {poolFee !== undefined ? (
                      <span className="text-muted-foreground truncate">
                        ${formatNumber(poolFee, true)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-12" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coin Reserves</span>
                  <div className="flex flex-col items-end">
                    <span>
                      {poolInfo
                        ? formatCoinAmount(
                            poolInfo.coinA.balance ?? "0",
                            poolInfo.coinA
                          )
                        : "-"}{" "}
                      {getCoinSymbol(poolInfo?.coinA)}
                    </span>
                    <span>
                      {poolInfo
                        ? formatCoinAmount(
                            poolInfo.coinB.balance ?? "0",
                            poolInfo.coinB
                          )
                        : "-"}{" "}
                      {getCoinSymbol(poolInfo?.coinB)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-4 mt-4">
            <span className="font-semibold text-lg">Liquidity Providers</span>
            <div className="flex justify-between mt-3 text-muted-foreground text-sm">
              <span>Address</span>
              <span>Percentage</span>
            </div>
            <div className="flex flex-col gap-3 mt-3">
              {lps.length
                ? lps.map((lp) => (
                    <div className="flex justify-between" key={lp.address}>
                      <Link
                        href={`${RUNESCAN_URL}/address/${lp.address}`}
                        className="group hover:underline inline-flex items-center"
                        target="_blank"
                      >
                        <span>{ellipseMiddle(lp.address, 14)}</span>
                        <ExternalLink className="ml-1 size-3 group-hover:text-foreground text-muted-foreground" />
                      </Link>
                      <div className="flex items-center">
                        <Circle
                          progress={lp.percentage}
                          size="18"
                          lineWidth="60"
                          progressColor="#f6d75a"
                          bgColor="#4c9aff"
                          showPercentage={false}
                        />
                        <span className="ml-1">
                          {lp.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                : [1, 2, 3, 4].map((idx) => (
                    <div className="flex justify-between" key={idx}>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
