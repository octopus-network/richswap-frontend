import { PoolInfo, Field, DepositState, UnspentOutput } from "@/types";
import { CoinField } from "@/components/coin-field";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useMemo, useState } from "react";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { formatCoinAmount, getCoinSymbol } from "@/lib/utils";

import {
  useDerivedDepositInfo,
  useDepositState,
  useDepositActionHandlers,
} from "@/store/deposit/hooks";

export function DepositForm({
  pool,
  onReview,
}: {
  pool: PoolInfo;
  onReview: (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[]
  ) => void;
}) {
  const { address } = useLaserEyes();

  const { onUserInput } = useDepositActionHandlers();
  const depositState = useDepositState();

  const { independentField, typedValue } = depositState;

  const { deposit, parsedAmount } = useDerivedDepositInfo(pool);

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");

  const coinABalance = useCoinBalance(address, pool.coinA?.id);
  const coinBBalance = useCoinBalance(address, pool.coinB?.id);

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

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
    independentField === Field.INPUT ? pool.coinB : pool.coinA;

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: formatCoinAmount(
        parsedAmounts[dependentField],
        dependentCoin
      ),
    }),
    [parsedAmounts, typedValue, dependentField, independentField, dependentCoin]
  );

  const coinAPrice = useCoinPrice(pool.coinA?.id);
  const coinBPrice = useCoinPrice(pool.coinB?.id);

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
        (Number(formattedAmounts[Field.INPUT]) === 0
          ? inputAmount
          : formattedAmounts[Field.INPUT]) || "0"
      ),
    [formattedAmounts, coinABalance, inputAmount]
  );

  const insufficientCoinBBalance = useMemo(
    () =>
      new Decimal(coinBBalance || "0").lt(
        (Number(formattedAmounts[Field.OUTPUT]) === 0
          ? outputAmount
          : formattedAmounts[Field.OUTPUT]) || "0"
      ),
    [formattedAmounts, coinBBalance, outputAmount]
  );

  return (
    <>
      <CoinField
        coin={pool.coinA}
        label="Bitcoin"
        pulsing={
          independentField === Field.OUTPUT &&
          deposit?.state === DepositState.LOADING
        }
        fiatValue={coinAFiatValue}
        onUserInput={(value) =>
          independentField === Field.OUTPUT &&
          Number(formattedAmounts[Field.INPUT]) === 0
            ? setInputAmount(value)
            : onUserInput(Field.INPUT, value)
        }
        value={
          Number(formattedAmounts[Field.INPUT]) === 0
            ? inputAmount
            : formattedAmounts[Field.INPUT]
        }
        className="border-border mt-4 px-3 pt-1 pb-2 !shadow-none bg-transparent"
      />
      <div className="flex items-center justify-center h-10 relative">
        <div className="size-7 bg-secondary rounded-full items-center justify-center flex relative z-10">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <div className="absolute inset-x-0 top-[50%] bg-border/60 h-[1px]" />
      </div>
      <CoinField
        coin={pool.coinB}
        label="Rune"
        pulsing={
          independentField === Field.INPUT &&
          deposit?.state === DepositState.LOADING
        }
        fiatValue={coinBFiatValue}
        onUserInput={(value) =>
          independentField === Field.INPUT &&
          Number(formattedAmounts[Field.OUTPUT]) === 0
            ? setOutputAmount(value)
            : onUserInput(Field.OUTPUT, value)
        }
        value={
          Number(formattedAmounts[Field.OUTPUT]) === 0
            ? outputAmount
            : formattedAmounts[Field.OUTPUT]
        }
        className="border-border px-3 pt-1 pb-2 !shadow-none bg-transparent"
      />
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
            disabled={
              !deposit ||
              deposit.state === DepositState.INVALID ||
              deposit.state === DepositState.LOADING ||
              insufficientCoinABalance ||
              insufficientCoinBBalance
            }
            onClick={() =>
              onReview(
                Number(formattedAmounts[Field.INPUT]) === 0
                  ? inputAmount
                  : formattedAmounts[Field.INPUT],
                Number(formattedAmounts[Field.OUTPUT]) === 0
                  ? outputAmount
                  : formattedAmounts[Field.INPUT],
                deposit?.nonce ?? "0",
                deposit?.utxos ?? []
              )
            }
          >
            {deposit?.state === DepositState.INVALID
              ? deposit?.errorMessage ?? "Review"
              : insufficientCoinABalance
              ? `Insufficient ${getCoinSymbol(pool.coinA)} Balance`
              : insufficientCoinBBalance
              ? `Insufficient ${getCoinSymbol(pool.coinB)} Balance`
              : "Deposit"}
          </Button>
        )}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Currency Reserves</span>
          <div className="flex flex-col items-end text-muted-foreground">
            <span>
              {formatCoinAmount(pool.coinAAmount, pool.coinA)}{" "}
              {getCoinSymbol(pool.coinA)}
            </span>
            <span>
              {formatCoinAmount(pool.coinBAmount, pool.coinB)}{" "}
              {getCoinSymbol(pool.coinB)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
