"use client";

import { CoinField } from "@/components/coin-field";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Field, Coin, SwapState } from "@/types";
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

import { formatCoinAmount } from "@/lib/utils";
import { useDefaultCoins } from "@/hooks/use-coins";
import { BITCOIN } from "@/lib/constants";

export function SwapPanel() {
  const { address } = useLaserEyes();
  const searchParams = useSearchParams();

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const { onUpdateCoins, onSwitchCoins, onSelectCoin, onUserInput } =
    useSwapActionHandlers();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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
    () => new Decimal(coinABalance || "0").lt(typedValue || "0"),
    [typedValue, coinABalance]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const [symbolA, symbolB] = [
      searchParams.get("coinA") ?? "",
      searchParams.get("coinB") ?? "",
    ];
    let [_coinA, _coinB] = [
      Object.values(coins).find((c) => c.symbol === symbolA) ?? null,
      Object.values(coins).find((c) => c.symbol === symbolB) ?? null,
    ];

    if (!_coinA && !_coinB) {
      _coinA = BITCOIN;
      _coinB = null;
    }
    onUpdateCoins(_coinA, _coinB);
  }, [onUpdateCoins, coins]);

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

    if (field === Field.INPUT && coin === coinB) {
      if (coinA) {
        params.set("coinB", coinA.symbol);
      }
      params.set("coinA", coin.symbol);
    } else if (field === Field.INPUT && coin === coinA) {
      if (coinB) {
        params.set("coinA", coinB.symbol);
      }
      params.set("coinB", coin.symbol);
    } else {
      params.set(field === Field.INPUT ? "coinA" : "coinB", coin.symbol);
    }

    const newQueryString = params.toString();
    const newUrl = `${window.location.pathname}${
      newQueryString ? `?${newQueryString}` : ""
    }`;

    window.history.replaceState(null, "", newUrl);
  };

  const handleSwitchCoins = () => {
    onSwitchCoins();
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (coinA) {
      params.set("coinB", coinA.symbol);
      if (!coinB) {
        params.delete("coinA");
      }
    }
    if (coinB) {
      params.set("coinA", coinB.symbol);
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

  console.log("swap", swap);

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
          coin={coinB}
          pulsing={
            independentField === Field.INPUT &&
            swap?.state === SwapState.LOADING
          }
          fiatValue={coinBFiatValue}
          onUserInput={(value) => onUserInput(Field.OUTPUT, value)}
          value={formattedAmounts[Field.OUTPUT]}
          onSelectCoin={(coin) => handleSelectCoin(Field.OUTPUT, coin)}
        />
        <div className="mt-4 text-sm justify-between flex">
          <span className="text-muted-foreground">Exchange Rate</span>
          <span className="text-muted-foreground">-</span>
        </div>
        <div className="mt-6">
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
                swap.state === SwapState.INVALID ||
                swap.state === SwapState.LOADING ||
                insufficientBalance ||
                !formattedAmounts[Field.OUTPUT]
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
                  : "Review"
                : "Review"}
            </Button>
          )}
        </div>
      </div>
      <ReviewModal
        coinA={coinA}
        coinB={coinB}
        coinAAmount={formattedAmounts[Field.INPUT]}
        coinBAmount={formattedAmounts[Field.OUTPUT]}
        poolKey={swap?.poolKey ?? ""}
        poolUtxos={swap?.utxos ?? []}
        nonce={swap?.nonce ?? "0"}
        open={reviewModalOpen}
        setOpen={setReviewModalOpen}
      />
    </>
  );
}
