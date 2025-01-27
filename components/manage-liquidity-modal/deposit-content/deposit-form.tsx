import { PoolInfo, Field, DepositState, UnspentOutput } from "@/types";
import { CoinField } from "@/components/coin-field";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useMemo } from "react";
import Decimal from "decimal.js";
import { formatCoinAmount } from "@/lib/utils";

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

  const insufficientCoinABalance = useMemo(
    () =>
      new Decimal(coinABalance || "0").lt(formattedAmounts[Field.INPUT] || "0"),
    [formattedAmounts, coinABalance]
  );

  const insufficientCoinBBalance = useMemo(
    () =>
      new Decimal(coinBBalance || "0").lt(
        formattedAmounts[Field.OUTPUT] || "0"
      ),
    [formattedAmounts, coinBBalance]
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
        onUserInput={(value) => onUserInput(Field.INPUT, value)}
        value={formattedAmounts[Field.INPUT]}
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
        onUserInput={(value) => onUserInput(Field.OUTPUT, value)}
        value={formattedAmounts[Field.OUTPUT]}
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
                formattedAmounts[Field.INPUT],
                formattedAmounts[Field.OUTPUT],
                deposit?.nonce ?? "0",
                deposit?.utxos ?? []
              )
            }
          >
            {deposit?.state === DepositState.INVALID
              ? deposit?.errorMessage ?? "Review"
              : insufficientCoinABalance
              ? `Inssuficient ${pool.coinA.symbol} Balance`
              : insufficientCoinBBalance
              ? `Inssuficient ${pool.coinB.symbol} Balance`
              : "Review"}
          </Button>
        )}
      </div>
    </>
  );
}
