import { PoolInfo, Field, DepositState } from "@/types";
import { CoinField } from "@/components/coin-field";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import { DepositReviewModal } from "./deposit-review-modal";
import { formatCoinAmount, getCoinSymbol } from "@/lib/utils";

import {
  useDerivedDepositInfo,
  useDepositState,
  useDepositActionHandlers,
} from "@/store/deposit/hooks";

export function DepositForm({ pool }: { pool: PoolInfo | undefined }) {
  const { address } = useLaserEyes(({ address }) => ({ address }));

  const { onUserInput } = useDepositActionHandlers();
  const depositState = useDepositState();

  const t = useTranslations("Pools");
  const { independentField, typedValue } = depositState;

  const { deposit, parsedAmount } = useDerivedDepositInfo(pool);

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isEmptyPool, setIsEmptyPool] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const coinABalance = useCoinBalance(pool?.coinA);
  const coinBBalance = useCoinBalance(pool?.coinB);

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  useEffect(() => {
    return () => {
      onUserInput(Field.INPUT, "");
    };
  }, [onUserInput]);

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]:
        independentField === Field.INPUT
          ? parsedAmount
          : deposit?.outputAmount ?? "",
      [Field.OUTPUT]:
        independentField === Field.OUTPUT
          ? parsedAmount
          : deposit?.outputAmount ?? "",
    }),
    [independentField, parsedAmount, deposit]
  );

  const dependentField: Field =
    independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const dependentCoin =
    independentField === Field.INPUT ? pool?.coinB : pool?.coinA;

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: dependentCoin
        ? formatCoinAmount(parsedAmounts[dependentField], dependentCoin)
        : "",
    }),
    [parsedAmounts, typedValue, dependentField, independentField, dependentCoin]
  );

  const coinAPrice = useCoinPrice(pool?.coinA?.id);
  const coinBPrice = useCoinPrice(pool?.coinB?.id);

  const coinAFiatValue = useMemo(
    () => Number(formattedAmounts[Field.INPUT]) * coinAPrice,
    [coinAPrice, formattedAmounts]
  );

  const coinBFiatValue = useMemo(
    () => Number(formattedAmounts[Field.OUTPUT]) * coinBPrice,
    [coinBPrice, formattedAmounts]
  );

  const insufficientCoinABalance = useMemo(
    () =>
      new Decimal(coinABalance || "0").lt(
        (deposit?.state === DepositState.EMPTY
          ? inputAmount
          : formattedAmounts[Field.INPUT]) || "0"
      ),
    [formattedAmounts, coinABalance, inputAmount, deposit]
  );

  const insufficientCoinBBalance = useMemo(
    () =>
      new Decimal(coinBBalance || "0").lt(
        (deposit?.state === DepositState.EMPTY
          ? outputAmount
          : formattedAmounts[Field.OUTPUT]) || "0"
      ),
    [formattedAmounts, coinBBalance, outputAmount, deposit]
  );

  const tooSmallFunds = useMemo(
    () =>
      pool
        ? Boolean(
            pool.coinA &&
              new Decimal(
                isEmptyPool
                  ? inputAmount || "0"
                  : formattedAmounts[Field.INPUT] || "0"
              ).lt(0.0001)
          )
        : false,
    [pool, inputAmount, isEmptyPool, formattedAmounts]
  );

  useEffect(() => {
    if (deposit?.state === DepositState.EMPTY && !isEmptyPool) {
      if (formattedAmounts[Field.INPUT] && !inputAmount) {
        setInputAmount(formattedAmounts[Field.INPUT]);
      } else if (formattedAmounts[Field.OUTPUT]) {
        setOutputAmount(formattedAmounts[Field.OUTPUT]);
      }
      setIsEmptyPool(true);
    }
  }, [deposit, inputAmount, formattedAmounts, isEmptyPool]);

  return (
    <>
      <CoinField
        coin={pool?.coinA ?? null}
        size="sm"
        label={t("bitcoin")}
        pulsing={
          independentField === Field.OUTPUT &&
          deposit?.state === DepositState.LOADING
        }
        fiatValue={coinAFiatValue}
        onUserInput={(value) =>
          isEmptyPool ? setInputAmount(value) : onUserInput(Field.INPUT, value)
        }
        value={isEmptyPool ? inputAmount : formattedAmounts[Field.INPUT]}
        className="border-border mt-4 px-3 pt-1 pb-2 !shadow-none bg-transparent"
      />
      <div className="flex items-center justify-center h-10 relative">
        <div className="size-7 bg-secondary rounded-full items-center justify-center flex relative z-10">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <div className="absolute inset-x-0 top-[50%] bg-border/60 h-[1px]" />
      </div>
      <CoinField
        coin={pool?.coinB}
        size="sm"
        label={t("rune")}
        pulsing={
          independentField === Field.INPUT &&
          deposit?.state === DepositState.LOADING
        }
        fiatValue={coinBFiatValue}
        onUserInput={(value) =>
          isEmptyPool
            ? setOutputAmount(value)
            : onUserInput(Field.OUTPUT, value)
        }
        value={isEmptyPool ? outputAmount : formattedAmounts[Field.OUTPUT]}
        className="border-border px-3 pt-1 pb-2 !shadow-none bg-transparent"
      />
      <div className="mt-6">
        {!address ? (
          <Button
            size="lg"
            className="w-full"
            onClick={() => updateConnectWalletModalOpen(true)}
          >
            {t("connectWallet")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={
              !deposit ||
              deposit.state === DepositState.INVALID ||
              deposit.state === DepositState.LOADING ||
              insufficientCoinABalance ||
              insufficientCoinBBalance ||
              (isEmptyPool &&
                (!Number(outputAmount) || !Number(inputAmount))) ||
              tooSmallFunds
            }
            onClick={() => setReviewModalOpen(true)}
          >
            {deposit?.state === DepositState.INVALID
              ? t(deposit?.errorMessage ?? "review")
              : insufficientCoinABalance
              ? t("insufficientBalance", { symbol: getCoinSymbol(pool?.coinA) })
              : insufficientCoinBBalance
              ? t("insufficientBalance", { symbol: getCoinSymbol(pool?.coinB) })
              : tooSmallFunds
              ? t("tooSmallFunds")
              : t("deposit")}
          </Button>
        )}
      </div>
      {pool && (
        <DepositReviewModal
          pool={pool}
          open={reviewModalOpen}
          setOpen={setReviewModalOpen}
          coinAAmount={
            isEmptyPool ? inputAmount : formattedAmounts[Field.INPUT]
          }
          coinBAmount={
            isEmptyPool ? outputAmount : formattedAmounts[Field.OUTPUT]
          }
          nonce={deposit?.nonce ?? "0"}
          poolUtxos={deposit?.utxos ?? []}
        />
      )}
    </>
  );
}
