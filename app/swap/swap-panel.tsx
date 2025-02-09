"use client";

import { CoinField } from "@/components/coin-field";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Field, Coin, SwapState, PoolData } from "@/types";
import { ReviewModal } from "./review-modal";
import { useSearchParams } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";

import {
  useSwapActionHandlers,
  useSwapState,
  useDerivedSwapInfo,
} from "@/store/swap/hooks";

import {
  formatCoinAmount,
  formatNumber,
  getCoinSymbol,
  getRunePriceInSats,
} from "@/lib/utils";
import { useDefaultCoins } from "@/hooks/use-coins";
import { BITCOIN, COIN_LIST } from "@/lib/constants";
import { Exchange } from "@/lib/exchange";

export function SwapPanel() {
  const { address } = useLaserEyes();
  const searchParams = useSearchParams();

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const { onUpdateCoins, onSwitchCoins, onSelectCoin, onUserInput } =
    useSwapActionHandlers();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [poolData, setPoolData] = useState<PoolData>();

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
          : swap?.outputAmount ?? "",
      [Field.OUTPUT]:
        independentField === Field.OUTPUT
          ? parsedAmount
          : swap?.outputAmount ?? "",
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

  const coinABalance = useCoinBalance(address, coinA?.id);

  const insufficientBalance = useMemo(
    () =>
      new Decimal(formattedAmounts[Field.INPUT] || "0").gt(coinABalance || "0"),
    [formattedAmounts, coinABalance]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const [symbolA, symbolB] = [
      searchParams.get("coinA") ?? "",
      searchParams.get("coinB") ?? "",
    ];

    let [_coinA, _coinB] = [
      Object.values(coins).find((c) => getCoinSymbol(c) === symbolA) ?? null,
      Object.values(coins).find((c) => getCoinSymbol(c) === symbolB) ?? null,
    ];

    if (!_coinA && !_coinB) {
      _coinA = BITCOIN;
      _coinB = COIN_LIST[1];
    }
    onUpdateCoins(_coinA, _coinB);
  }, [onUpdateCoins, coins]);

  useEffect(() => {
    if (!coinA || !coinB) {
      return;
    }
    Exchange.getPoolKey(coinA.id, coinB.id)
      .then((poolKey) => {
        if (poolKey) {
          return Exchange.getPoolData(poolKey);
        }
        return undefined;
      })
      .then(setPoolData);
  }, [coinA, coinB]);

  const coinAPrice = useCoinPrice(coinA?.id);
  const coinBPrice = useCoinPrice(coinB?.id);

  const coinAFiatValue = useMemo(
    () => Number(formattedAmounts[Field.INPUT]) * coinAPrice,
    [coinAPrice, formattedAmounts]
  );

  const coinBFiatValue = useMemo(
    () => Number(formattedAmounts[Field.OUTPUT]) * coinBPrice,
    [coinBPrice, formattedAmounts]
  );

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

  const tooSmallFunds = useMemo(
    () =>
      Boolean(
        coinA &&
          new Decimal(
            coinA.id === BITCOIN.id
              ? formattedAmounts[Field.INPUT] || 0
              : formattedAmounts[Field.OUTPUT] || 0
          ).lt(0.0001)
      ),
    [coinA, formattedAmounts]
  );

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

  const [runeAmount, btcAmount] = useMemo(
    () =>
      coinA?.id === BITCOIN.id
        ? [formattedAmounts[Field.OUTPUT], formattedAmounts[Field.INPUT]]
        : [formattedAmounts[Field.INPUT], formattedAmounts[Field.OUTPUT]],
    [coinA, formattedAmounts]
  );

  const runePriceInSats = useMemo(
    () =>
      Number(runeAmount) && Number(btcAmount)
        ? getRunePriceInSats(btcAmount, runeAmount)
        : undefined,
    [runeAmount, btcAmount]
  );

  const runePriceInSatsFromReserves = useMemo(
    () =>
      poolData
        ? getRunePriceInSats(
            formatCoinAmount(
              poolData.coinAAmount,
              coinA?.id === BITCOIN.id ? coinA : coinB
            ),
            formatCoinAmount(
              poolData.coinBAmount,
              coinA?.id === BITCOIN.id ? coinB : coinA
            )
          )
        : undefined,
    [poolData, coinA, coinB]
  );

  const priceImpact = useMemo(
    () =>
      Number(runePriceInSatsFromReserves) &&
      Number(runePriceInSats) &&
      swap?.state !== SwapState.LOADING
        ? ((Number(runePriceInSats) - Number(runePriceInSatsFromReserves)) *
            100) /
          Number(runePriceInSatsFromReserves)
        : undefined,
    [runePriceInSats, runePriceInSatsFromReserves, swap]
  );

  return (
    <>
      <div className="mt-4">
        <CoinField
          label="You're selling"
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
          label="You're buying"
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
              Connect Wallet
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
                tooSmallFunds
              }
            >
              {insufficientBalance
                ? `Insufficient Balance`
                : !coinA
                ? "Select Coin A"
                : !coinB
                ? "Select Coin B"
                : swap
                ? swap.state === SwapState.NO_POOL
                  ? "No Pool"
                  : swap.state === SwapState.INVALID
                  ? swap.errorMessage
                  : tooSmallFunds
                  ? "Too Small Funds"
                  : "Review"
                : "Review"}
            </Button>
          )}
        </div>
        <div className="mt-4 text-xs flex flex-col gap-1">
          {Boolean(
            formattedAmounts[Field.INPUT] && formattedAmounts[Field.OUTPUT]
          ) ? (
            <div className="justify-between flex">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span>
                {formattedAmounts[Field.INPUT] && formattedAmounts[Field.OUTPUT]
                  ? `1 ${getCoinSymbol(coinB)} = ${formatNumber(
                      (1 / Number(formattedAmounts[Field.OUTPUT])) *
                        Number(formattedAmounts[Field.INPUT])
                    )} ${getCoinSymbol(coinA)}`
                  : "-"}
              </span>
            </div>
          ) : null}
          <div className="justify-between flex">
            <span className="text-muted-foreground">Rune Price</span>
            {runePriceInSatsFromReserves !== undefined ? (
              <div className="flex flex-col items-end">
                <span>
                  {runePriceInSatsFromReserves}{" "}
                  <em className="text-muted-foreground">sats</em>
                </span>
              </div>
            ) : (
              "-"
            )}
          </div>
          {priceImpact !== undefined ? (
            <div className="justify-between flex">
              <span className="text-muted-foreground">Price Impact</span>
              <div className="flex items-end">
                <span
                  className={
                    priceImpact < 0 ? "text-red-400" : "text-green-400"
                  }
                >
                  {priceImpact > 0 && "+"}
                  {priceImpact.toFixed(2)}%
                </span>
                <span className="ml-1 text-muted-foreground">
                  ({runePriceInSats} <em>sats</em>)
                </span>
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
        poolKey={swap?.pool?.key ?? ""}
        poolUtxos={swap?.utxos ?? []}
        nonce={swap?.nonce ?? "0"}
        open={reviewModalOpen}
        setOpen={setReviewModalOpen}
      />
    </>
  );
}
