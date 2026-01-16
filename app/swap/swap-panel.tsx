"use client";

import { CoinField } from "@/components/coin-field";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, ChartLine, RefreshCcw } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Field, Coin, SwapState } from "@/types";
import { ReviewModal } from "./review-modal";
import { useSearchParams } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useKlineChartOpen, useToggleKlineChartOpen } from "@/store/user/hooks";

import {
  useSwapActionHandlers,
  useSwapState,
  useDerivedSwapInfo,
} from "@/store/swap/hooks";

import { usePoolList } from "@/hooks/use-pools";
import {
  cn,
  ellipseMiddle,
  formatCoinAmount,
  formatNumber,
  getCoinSymbol,
} from "@/lib/utils";
import { useDefaultCoins } from "@/hooks/use-coins";
import { BITCOIN } from "@/lib/constants";
import Link from "next/link";
import TxQueue from "@/components/tx-queue";
import { Orchestrator } from "@/lib/orchestrator";

export function SwapPanel({
  onRuneChange,
}: {
  onRuneChange: (rune: Coin | undefined) => void;
}) {
  const { address } = useLaserEyes();
  const searchParams = useSearchParams();

  const klineChartOpen = useKlineChartOpen();
  const toggleKlineChartOpen = useToggleKlineChartOpen();

  const t = useTranslations("Swap");
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const { onUpdateCoins, onSwitchCoins, onSelectCoin, onUserInput } =
    useSwapActionHandlers();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [pendingTxCount, setPendingTxCount] = useState(0);

  const swapState = useSwapState();

  const coins = useDefaultCoins();

  const {
    [Field.INPUT]: { coin: coinA },
    [Field.OUTPUT]: { coin: coinB },
    independentField,
    typedValue,
  } = swapState;

  const { swap, parsedAmount } = useDerivedSwapInfo();

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]:
        independentField === Field.INPUT
          ? parsedAmount
          : swap?.routes?.length
          ? swap.routes[swap.routes.length - 1].outputAmount
          : "",
      [Field.OUTPUT]:
        independentField === Field.OUTPUT
          ? parsedAmount
          : swap?.routes?.length
          ? swap.routes[swap.routes.length - 1].outputAmount
          : "",
    }),
    [independentField, parsedAmount, swap]
  );

  const dependentField: Field =
    independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: formatCoinAmount(
        parsedAmounts[dependentField],
        swapState[dependentField].coin
      ),
    }),
    [parsedAmounts, typedValue, dependentField, independentField, swapState]
  );

  const coinABalance = useCoinBalance(coinA);

  const insufficientBalance = useMemo(
    () =>
      new Decimal(formattedAmounts[Field.INPUT] || "0").gt(coinABalance || "0"),
    [formattedAmounts, coinABalance]
  );

  const poolList = usePoolList();

  const defaultCoinB = useMemo(() => {
    const sortedPoolList = poolList.sort((pa, pb) => Number(pa) - Number(pb));
    return sortedPoolList?.length && sortedPoolList[0].coinB.name
      ? sortedPoolList[0].coinB.name
      : "HOPE•YOU•GET•RICH";
  }, [poolList]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const [symbolA, symbolB] = [
      searchParams.get("coinA") ?? "BTC",
      searchParams.get("coinB") ?? defaultCoinB,
    ];

    const [_coinA, _coinB] = [
      Object.values(coins).find((c) => getCoinSymbol(c) === symbolA) ?? null,
      Object.values(coins).find((c) => getCoinSymbol(c) === symbolB) ?? null,
    ];

    onUpdateCoins(_coinA, _coinB);
  }, [onUpdateCoins, coins, defaultCoinB]);

  const coinAPrice = useCoinPrice(coinA?.id);
  const coinBPrice = useCoinPrice(coinB?.id);

  const [coinAAmount, coinBAmount] = useMemo(
    () => [
      Number(formattedAmounts[Field.INPUT]),
      Number(formattedAmounts[Field.OUTPUT]),
    ],
    [formattedAmounts]
  );

  const pools = useMemo(() => {
    if (!coinA || !coinB) {
      return [];
    }
    return (
      coinA.id !== BITCOIN.id
        ? [
            poolList.find((pool) => pool.coinB.id === coinA.id),
            poolList.find((pool) => pool.coinB.id === coinB.id),
          ]
        : [poolList.find((pool) => pool.coinB.id === coinB.id)]
    ).filter((p) => !!p);
  }, [coinA, coinB, poolList]);

  const coinAFiatValue = useMemo(
    () => coinAAmount * coinAPrice,
    [coinAPrice, coinAAmount]
  );

  const coinBFiatValue = useMemo(
    () => coinBAmount * coinBPrice,
    [coinBPrice, coinBAmount]
  );

  useEffect(() => {
    onRuneChange(
      coinA && coinB && coinA.id !== BITCOIN.id && coinB.id !== BITCOIN.id
        ? coinB
        : coinA && coinA.id !== BITCOIN.id
        ? coinA
        : coinB && coinB.id !== BITCOIN.id
        ? coinB
        : undefined
    );
  }, [coinA, coinB, onRuneChange]);

  const handleSelectCoin = (field: Field, coin: Coin) => {
    onSelectCoin(field, coin);

    const params = new URLSearchParams(searchParams?.toString() || "");

    const coinSymbol = getCoinSymbol(coin);
    if (field === Field.INPUT && coin === coinB) {
      if (coinA) {
        const coinASymbol = getCoinSymbol(coinA);
        params.set("coinB", coinASymbol);
      }
      params.set("coinA", coinSymbol);
    } else if (field === Field.INPUT && coin === coinA) {
      if (coinB) {
        const coinBSymbol = getCoinSymbol(coinB);
        params.set("coinA", coinBSymbol);
      }
      params.set("coinB", coinSymbol);
    } else {
      params.set(field === Field.INPUT ? "coinA" : "coinB", coinSymbol);
    }

    const newQueryString = params.toString();
    const newUrl = `${window.location.pathname}${
      newQueryString ? `?${newQueryString}` : ""
    }`;

    window.history.replaceState(null, "", newUrl);
  };

  const handleSwitchCoins = () => {
    onSwitchCoins();
    onUserInput(Field.INPUT, "");
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (coinA) {
      const coinASymbol = getCoinSymbol(coinA);
      params.set("coinB", coinASymbol);
      if (!coinB) {
        params.delete("coinA");
      }
    }
    if (coinB) {
      const coinBSymbol = getCoinSymbol(coinB);
      params.set("coinA", coinBSymbol);
      if (!coinA) {
        params.delete("coinB");
      }
    }

    const newQueryString = params.toString();
    const newUrl = `${window.location.pathname}${
      newQueryString ? `?${newQueryString}` : ""
    }`;

    window.history.replaceState(null, "", newUrl);
  };

  const btcPrice = useCoinPrice(BITCOIN.id);

  const priceImpacts = useMemo(() => {
    if (!swap?.routes?.length || !btcPrice) {
      return undefined;
    }
    const [route0, route1] = swap.routes;

    const impacts = [
      {
        runeName: route0.pool.name,
        impact: route0.priceImpact,
        runePrice: (route0.runePriceInSats * btcPrice) / Math.pow(10, 8),
        runePriceInSats: route0.runePriceInSats,
      },
    ];

    if (route1) {
      impacts.push({
        impact: route1.priceImpact,
        runeName: route1.pool.name,
        runePrice: (route1.runePriceInSats * btcPrice) / Math.pow(10, 8),
        runePriceInSats: route1.runePriceInSats,
      });
    }

    return impacts;
  }, [swap, btcPrice]);

  const fee = useMemo(() => {
    if (!swap?.routes?.length || !btcPrice) {
      return undefined;
    }
    const [route0, route1] = swap.routes;

    let amount =
      route0.inputCoin.id === BITCOIN.id
        ? Number(route0.inputAmount)
        : Number(route0.outputAmount);

    const feeRates = [route0.pool.lpFeeRate + route0.pool.protocolFeeRate];
    let fee = (feeRates[0] * Number(amount)) / 1000000;

    if (route1) {
      amount =
        route1.inputCoin.id === BITCOIN.id
          ? Number(route1.inputAmount)
          : Number(route1.outputAmount);
      feeRates.push(route1.pool.lpFeeRate + route1.pool.protocolFeeRate);
      fee += (feeRates[1] * Number(amount)) / 1000000;
    }

    return {
      fee: (fee * btcPrice) / Math.pow(10, 8),
      feeRates,
      reeInSats: fee,
    };
  }, [swap, btcPrice]);

  const poolPaused = useMemo(() => {
    return pools.some((p) => p.paused);
  }, [pools]);

  const onRefreshQuote = () => {
    swap?.refetch?.();
  };

  const realTimePendingTxCount = useMemo(() => {
    return Math.max(...(swap?.routes?.map((r) => r.poolPendingTxCount) ?? [0]));
  }, [swap]);

  useEffect(() => {
    if (coinA?.id === BITCOIN.id || coinB?.id === BITCOIN.id) {
      const pool = poolList.find(
        (p) => p.coinB.id === (coinA?.id === BITCOIN.id ? coinB?.id : coinA?.id)
      );
      if (pool?.address) {
        Orchestrator.getPendingTxCountOfPool(pool.address).then(
          setPendingTxCount
        );
      }
    } else {
      const pool1 = poolList.find((p) => p.coinB.id === coinA?.id);
      const pool2 = poolList.find((p) => p.coinB.id === coinB?.id);
      Promise.all([
        pool1?.address
          ? Orchestrator.getPendingTxCountOfPool(pool1.address)
          : 0,
        pool2?.address
          ? Orchestrator.getPendingTxCountOfPool(pool2.address)
          : 0,
      ]).then(([count1, count2]) => {
        setPendingTxCount(Math.max(count1, count2));
      });
    }
  }, [coinA, coinB, poolList]);

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-semibold">{t("swap")}</span>
        <div className="flex items-center gap-2">
          <TxQueue txCount={realTimePendingTxCount || pendingTxCount} />
          <Button
            size="icon"
            className={cn(
              "rounded-full size-8 text-muted-foreground border border-transparent",
              klineChartOpen
                ? "border-primary text-primary"
                : "hover:text-primary"
            )}
            variant="secondary"
            onClick={() => toggleKlineChartOpen()}
          >
            <ChartLine className="size-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-full size-8 text-muted-foreground hover:text-foreground"
            variant="secondary"
            onClick={onRefreshQuote}
            disabled={!swap?.refetch || swap.state === SwapState.LOADING}
          >
            <RefreshCcw className={cn("size-4")} />
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <CoinField
          label={t("youAreSelling")}
          coin={coinA}
          onUserInput={(value) => onUserInput(Field.INPUT, value)}
          value={formattedAmounts[Field.INPUT]}
          fiatValue={coinAFiatValue}
          pulsing={
            independentField === Field.OUTPUT &&
            swap?.state === SwapState.LOADING
          }
          className="bg-card/40 border-border"
          onSelectCoin={(coin) => handleSelectCoin(Field.INPUT, coin)}
        />
        <div className="flex items-center justify-center h-11 relative">
          <Button
            size="icon"
            className="rounded-full size-8 hover:text-foreground text-muted-foreground relative z-10"
            variant="secondary"
            onClick={handleSwitchCoins}
          >
            <ArrowDownUp className="size-4" />
          </Button>
          <div className="absolute inset-x-0 top-[50%] bg-border/60 h-[1px]" />
        </div>
        <CoinField
          label={t("youAreBuying")}
          placeholder=""
          coin={coinB}
          pulsing={
            independentField === Field.INPUT &&
            swap?.state === SwapState.LOADING
          }
          disabled
          fiatValue={coinBFiatValue}
          onUserInput={(value) => onUserInput(Field.OUTPUT, value)}
          value={formattedAmounts[Field.OUTPUT]}
          className="bg-card"
          onSelectCoin={(coin) => handleSelectCoin(Field.OUTPUT, coin)}
        />

        <div className="mt-4">
          {!address ? (
            <Button
              size="xl"
              className="w-full"
              onClick={() => updateConnectWalletModalOpen(true)}
            >
              {t("connectWallet")}
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={() => setReviewModalOpen(true)}
              disabled={
                !coinA ||
                !coinB ||
                !swap ||
                !Number(formattedAmounts[Field.INPUT]) ||
                !Number(formattedAmounts[Field.OUTPUT]) ||
                swap.state === SwapState.INVALID ||
                swap.state === SwapState.LOADING ||
                insufficientBalance ||
                !formattedAmounts[Field.OUTPUT] ||
                poolPaused
              }
            >
              {poolPaused
                ? t("poolPaused")
                : insufficientBalance
                ? t("insufficientBalance")
                : !coinA
                ? t("selectCoinA")
                : !coinB
                ? t("selectCoinB")
                : swap
                ? swap.state === SwapState.INVALID
                  ? swap.errorMessage
                  : t("review")
                : t("review")}
            </Button>
          )}
        </div>
        <div className="mt-4 text-xs flex flex-col gap-1">
          <div className="justify-between flex">
            <span className="text-muted-foreground">{t("exchangeRate")}</span>
            <span>
              {formattedAmounts[Field.INPUT] && formattedAmounts[Field.OUTPUT]
                ? `1 ${getCoinSymbol(coinB)} = ${formatNumber(
                    (1 / Number(formattedAmounts[Field.OUTPUT])) *
                      Number(formattedAmounts[Field.INPUT])
                  )} ${getCoinSymbol(coinA)}`
                : "-"}
            </span>
          </div>

          {priceImpacts && (
            <>
              <div className="justify-between flex">
                <span className="text-muted-foreground">
                  {priceImpacts[0].runeName} {t("price")}
                </span>
                <div className="flex flex-col items-end">
                  <span>
                    {formatNumber(priceImpacts[0].runePriceInSats)} sats
                    <em
                      className={cn(
                        "ml-1",
                        priceImpacts[0].impact >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      ({priceImpacts[0].impact >= 0 && "+"}
                      {priceImpacts[0].impact.toFixed(2)}%)
                    </em>
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    ${formatNumber(priceImpacts[0].runePrice)}
                  </span>
                </div>
              </div>
              {priceImpacts[1] && (
                <div className="justify-between flex">
                  <span className="text-muted-foreground">
                    {priceImpacts[1].runeName} {t("price")}
                  </span>
                  <div className="flex flex-col items-end">
                    <span>
                      {formatNumber(priceImpacts[1].runePriceInSats)} sats
                      <em
                        className={cn(
                          "ml-1",
                          priceImpacts[1].impact >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        ({priceImpacts[1].impact >= 0 && "+"}
                        {priceImpacts[1].impact.toFixed(2)}%)
                      </em>
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ${formatNumber(priceImpacts[1].runePrice)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          {fee && (
            <div className="justify-between flex">
              <span className="text-muted-foreground">
                {t("fee")} (
                {fee.feeRates.map((fr) => `${fr / 10000}%`).join("+")})
              </span>
              <div className="flex flex-col items-end">
                <span>{formatNumber(fee.reeInSats, true)} sats</span>
                <span className="text-muted-foreground">
                  {" "}
                  ${formatNumber(fee.fee)}
                </span>
              </div>
            </div>
          )}
          {swap?.routes?.length ? (
            <div className="justify-between flex">
              <span className="text-muted-foreground">{t("priceImpact")}</span>
              <span>
                {
                  swap?.routes.sort(
                    (a, b) => b.poolPriceImpact ?? 0 - (a.poolPriceImpact ?? 0)
                  )[0].poolPriceImpact
                }
                %
              </span>
            </div>
          ) : null}

          {pools?.length ? (
            <div className="justify-between flex">
              <span className="text-muted-foreground">
                {t("involvedPools")}
              </span>
              <div className="flex flex-col gap-1">
                {pools.map((pool) => (
                  <Link
                    href={`/pools/${pool.address}`}
                    key={pool.address}
                    className="hover:underline"
                  >
                    <div className="flex justify-end">
                      <span>{pool.name}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">
                        (...{ellipseMiddle(pool.address).split("...")[1]})
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <ReviewModal
        coinA={coinA}
        coinB={coinB}
        coinAAmount={formattedAmounts[Field.INPUT]}
        coinBAmount={formattedAmounts[Field.OUTPUT]}
        swapQuote={swap}
        open={reviewModalOpen}
        setOpen={setReviewModalOpen}
      />
    </>
  );
}
