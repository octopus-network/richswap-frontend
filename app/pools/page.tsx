"use client";

import { CreateButton } from "./create-button";
import {
  usePoolList,
  usePoolsFee,
  usePoolsTrades,
  usePoolsTvl,
  usePoolsVolume,
} from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoinPrice } from "@/hooks/use-prices";
import { BITCOIN } from "@/lib/constants";
import { PoolRow } from "./pool-row";
import { formatNumber } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";
import {
  Waves,
  Coins,
  ArrowLeftRight,
  Database,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";

type SortField = "tvl" | "fee" | "volume" | "yield" | "default";
type SortDirection = "asc" | "desc";

export default function Pools() {
  const poolList = usePoolList();
  const poolsTvl = usePoolsTvl();
  const poolsTrades = usePoolsTrades();
  const poolsFee = usePoolsFee();
  const btcPrice = useCoinPrice(BITCOIN.id);
  const poolsVolume = usePoolsVolume();
  const t = useTranslations("Pools");

  const [sortField, setSortField] = useState<SortField>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="size-3 text-primary" />
    ) : (
      <ArrowDown className="size-3 text-primary" />
    );
  };

  const sortedPoolList = useMemo(() => {
    if (!poolList?.length || sortField === "default") {
      return poolList;
    }

    return [...poolList].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortField) {
        case "tvl":
          aValue = poolsTvl[a.key] ?? 0;
          bValue = poolsTvl[b.key] ?? 0;
          break;
        case "fee":
          aValue = poolsFee[a.key] ?? 0;
          bValue = poolsFee[b.key] ?? 0;
          break;
        case "volume":
          aValue =
            poolsVolume?.find((p) => p.pool_address === a.address)?.volume ?? 0;
          bValue =
            poolsVolume?.find((p) => p.pool_address === b.address)?.volume ?? 0;
          break;
        case "yield":
          const aTvl = poolsTvl[a.key] ?? 0;
          const bTvl = poolsTvl[b.key] ?? 0;
          const aFee = poolsFee[a.key] ?? 0;
          const bFee = poolsFee[b.key] ?? 0;
          aValue = aTvl === 0 ? 0 : (aFee * 100) / aTvl;
          bValue = bTvl === 0 ? 0 : (bFee * 100) / bTvl;
          break;
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [poolList, sortField, sortDirection, poolsTvl, poolsFee, poolsVolume]);

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

  const poolsVolumeInSats = useMemo(() => {
    if (!poolsVolume) {
      return undefined;
    }
    return poolsVolume.reduce((total, curr) => total + curr.volume, 0);
  }, [poolsVolume]);

  const poolsVolumeInBtc = useMemo(
    () =>
      poolsVolumeInSats !== undefined
        ? new Decimal(poolsVolumeInSats).div(Math.pow(10, 8)).toNumber()
        : undefined,
    [poolsVolumeInSats]
  );

  const poolsVolumeFiatValue = useMemo(
    () =>
      poolsVolumeInBtc && btcPrice ? poolsVolumeInBtc * btcPrice : undefined,
    [poolsVolumeInBtc, btcPrice]
  );

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center">
          <span className="text-3xl font-semibold">{t("pools")}</span>
          <CreateButton />
        </div>
        <div className="hidden md:grid mt-6 md:grid-cols-4 gap-4">
          <div className="py-3 px-4 border bg-secondary/50 rounded-xl items-center flex">
            <div className="size-8 rounded-xl flex items-center justify-center bg-green-400/10">
              <Waves className="size-4 text-green-400" />
            </div>
            <div className="flex flex-col space-y-0.5 ml-4">
              <span className="text-muted-foreground text-xs">{t("tvl")}</span>
              {poolsTvlInBtc ? (
                <span className="font-semibold text-xl">
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
          <div className="py-3 px-4 border bg-secondary/50 rounded-xl items-center flex">
            <div className="size-8 rounded-xl flex items-center justify-center bg-purple-400/10">
              <Coins className="size-4 text-purple-400" />
            </div>
            <div className="flex flex-col space-y-0.5 ml-4">
              <span className="text-muted-foreground text-xs">{t("fee")}</span>
              {poolsFeeInSats ? (
                <span className="font-semibold text-xl">
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
          <div className="py-3 px-4 border bg-secondary/50 rounded-xl items-center flex">
            <div className="size-8 rounded-xl flex items-center justify-center bg-primary/10">
              <ArrowLeftRight className="size-4 text-primary" />
            </div>
            <div className="flex flex-col space-y-0.5 ml-4">
              <span className="text-muted-foreground text-xs">
                {t("trades")}
              </span>
              {poolsTrades ? (
                <span className="font-semibold text-xl">{poolsTrades}</span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
            </div>
          </div>

          <div className="py-3 px-4 border bg-secondary/50 rounded-xl items-center flex">
            <div className="size-8 rounded-xl flex items-center justify-center bg-green-400/10">
              <Database className="size-4 text-yellow-400" />
            </div>
            <div className="flex flex-col space-y-0.5 ml-4">
              <span className="text-muted-foreground text-xs">
                {t("24hVolume")}
              </span>
              {poolsVolumeInBtc ? (
                <span className="font-semibold text-xl">
                  {formatNumber(poolsVolumeInBtc)} ₿
                </span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
              {poolsVolumeFiatValue ? (
                <span className="text-xs text-muted-foreground">
                  ${formatNumber(poolsVolumeFiatValue, true)}
                </span>
              ) : (
                <Skeleton className="h-4 w-12" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col space-y-2 md:hidden px-4 py-3 border bg-secondary/50 rounded-xl">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">{t("tvl")}</span>
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
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">{t("fee")}</span>
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
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">{t("trades")}</span>
            <div className="flex flex-col space-y-0.5 items-end">
              {poolsTrades ? (
                <span className="font-semibold">{poolsTrades}</span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
            </div>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              {t("24hVolume")}
            </span>
            <div className="flex flex-col space-y-0.5 items-end">
              {poolsVolumeInBtc ? (
                <span className="font-semibold">
                  {formatNumber(poolsVolumeInBtc)} ₿
                </span>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
              {poolsVolumeFiatValue ? (
                <span className="text-xs text-muted-foreground">
                  ${formatNumber(poolsVolumeFiatValue, true)}
                </span>
              ) : (
                <Skeleton className="h-4 w-12" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 border rounded-xl overflow-hidden">
          <div className="grid px-4 bg-secondary/50 text-sm rounded-t-xl md:grid-cols-14 grid-cols-9 items-center gap-1 sm:gap-3 md:gap-6 py-3 text-muted-foreground">
            <div className="col-span-4">{t("pool")}</div>

            <div className="col-span-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal"
                onClick={() => handleSort("tvl")}
              >
                <span>{t("tvl")}</span>
                <SortIcon field="tvl" />
              </Button>
            </div>

            <div className="col-span-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal"
                onClick={() => handleSort("fee")}
              >
                <span>{t("fee")}</span>
                <SortIcon field="fee" />
              </Button>
            </div>

            <div className="col-span-2 hidden md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal"
                onClick={() => handleSort("volume")}
              >
                <span>{t("volume")}</span>
                <SortIcon field="volume" />
              </Button>
            </div>

            <div className="col-span-2 hidden md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal"
                onClick={() => handleSort("yield")}
              >
                <span>{t("yieldTvl")}</span>
                <SortIcon field="yield" />
              </Button>
            </div>

            <div className="col-span-1 hidden md:flex" />
          </div>
          {sortedPoolList?.length
            ? sortedPoolList.map((pool, idx) => (
                <PoolRow pool={pool} key={idx} />
              ))
            : [1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="grid md:grid-cols-14 grid-cols-9 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 px-4 py-3 bg-secondary/20"
                >
                  <div className="col-span-4 flex items-center space-x-3">
                    <Skeleton className="size-10 rounded-full hidden sm:block" />
                    <div className="flex flex-col space-y-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                  <div className="col-span-3 flex">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <div className="col-span-2 flex">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <div className="col-span-2 flex">
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
