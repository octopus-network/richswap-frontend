import { PoolInfo, Field, DonateState } from "@/types";
import { CoinField } from "@/components/coin-field";

import { Button } from "@/components/ui/button";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import { DonateReviewModal } from "./donate-review-modal";
import { formatCoinAmount, getCoinSymbol } from "@/lib/utils";

import {
  useDerivedDonateInfo,
  useDonateState,
  useDonateActionHandlers,
} from "@/store/donate/hooks";

export function DonateForm({ pool }: { pool: PoolInfo | undefined }) {
  const { address } = useLaserEyes();

  const { onUserInput } = useDonateActionHandlers();
  const depositState = useDonateState();

  const t = useTranslations("Pools");
  const { typedValue } = depositState;

  const { donate, parsedAmount } = useDerivedDonateInfo(pool);

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isEmptyPool, setIsEmptyPool] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const coinABalance = useCoinBalance(pool?.coinA);

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  useEffect(() => {
    return () => {
      onUserInput(Field.INPUT, "");
    };
  }, [onUserInput]);

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]: parsedAmount,
      [Field.OUTPUT]: donate?.coinBAmount ?? "",
    }),
    [parsedAmount, donate]
  );

  const independentField: Field = Field.INPUT;
  const dependentField: Field = Field.OUTPUT;

  const dependentCoin = pool?.coinB;

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

  const coinAFiatValue = useMemo(
    () => Number(formattedAmounts[Field.INPUT]) * coinAPrice,
    [coinAPrice, formattedAmounts]
  );

  const insufficientCoinABalance = useMemo(
    () =>
      new Decimal(coinABalance || "0").lt(
        (donate?.state === DonateState.EMPTY
          ? inputAmount
          : formattedAmounts[Field.INPUT]) || "0"
      ),
    [formattedAmounts, coinABalance, inputAmount, donate]
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
    if (donate?.state === DonateState.EMPTY && !isEmptyPool) {
      if (formattedAmounts[Field.INPUT] && !inputAmount) {
        setInputAmount(formattedAmounts[Field.INPUT]);
      } else if (formattedAmounts[Field.OUTPUT]) {
        setOutputAmount(formattedAmounts[Field.OUTPUT]);
      }
      setIsEmptyPool(true);
    }
  }, [donate, inputAmount, formattedAmounts, isEmptyPool]);

  return (
    <>
      <CoinField
        coin={pool?.coinA ?? null}
        size="sm"
        label={t("bitcoin")}
        fiatValue={coinAFiatValue}
        onUserInput={(value) =>
          isEmptyPool ? setInputAmount(value) : onUserInput(Field.INPUT, value)
        }
        value={isEmptyPool ? inputAmount : formattedAmounts[Field.INPUT]}
        className="border-border mt-4 px-3 pt-1 pb-2 !shadow-none bg-transparent"
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
              !donate ||
              donate.state === DonateState.INVALID ||
              donate.state === DonateState.LOADING ||
              insufficientCoinABalance ||
              (isEmptyPool &&
                (!Number(outputAmount) || !Number(inputAmount))) ||
              tooSmallFunds
            }
            onClick={() => setReviewModalOpen(true)}
          >
            {donate?.state === DonateState.INVALID
              ? t(donate?.errorMessage ?? "review")
              : insufficientCoinABalance
              ? t("insufficientBalance", { symbol: getCoinSymbol(pool?.coinA) })
              : tooSmallFunds
              ? t("tooSmallFunds")
              : t("donate")}
          </Button>
        )}
      </div>
      {pool && (
        <DonateReviewModal
          pool={pool}
          open={reviewModalOpen}
          setOpen={setReviewModalOpen}
          coinAAmount={
            isEmptyPool ? inputAmount : formattedAmounts[Field.INPUT]
          }
          coinBAmount={
            isEmptyPool ? outputAmount : formattedAmounts[Field.OUTPUT]
          }
          nonce={donate?.nonce ?? "0"}
          poolUtxos={donate?.utxos ?? []}
        />
      )}
    </>
  );
}
