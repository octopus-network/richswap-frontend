import {
  Position,
  PoolInfo,
  Field,
  DepositState,
  UnspentOutput,
} from "@/types";
import { CoinField } from "@/components/coin-field";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useEffect, useMemo, useState } from "react";
import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import { LockLpSelector } from "@/components/lock-lp-selector";
import {
  BITCOIN_BLOCK_TIME_MINUTES,
  PERMANENT_LOCK_BLOCKS,
} from "@/lib/constants";
import moment from "moment";
import { useLatestBlock } from "@/hooks/use-latest-block";

import {
  formatCoinAmount,
  getCoinSymbol,
  getRunePriceInSats,
} from "@/lib/utils";

import {
  useDerivedDepositInfo,
  useDepositState,
  useDepositActionHandlers,
} from "@/store/deposit/hooks";

export function DepositForm({
  pool,
  onReview,
  position,
}: {
  pool: PoolInfo | undefined;
  onReview: (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[],
    lockBlocks: number
  ) => void;
  position: Position | null | undefined;
}) {
  const { address } = useLaserEyes();
  const t = useTranslations("Pools");
  const { onUserInput } = useDepositActionHandlers();
  const depositState = useDepositState();
  const { data: latestBlock } = useLatestBlock();

  const { independentField, typedValue } = depositState;

  const { deposit, parsedAmount } = useDerivedDepositInfo(pool);

  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isEmptyPool, setIsEmptyPool] = useState(false);

  const coinABalance = useCoinBalance(pool?.coinA);
  const coinBBalance = useCoinBalance(pool?.coinB);

  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const [lockBlocks, setLockBlocks] = useState(0);

  const handleLockChange = (blocks: number, date: Date | null) => {
    setLockBlocks(blocks);
    console.log(
      `LP will be locked for ${blocks} blocks until ${date?.toLocaleDateString()}`
    );
  };

  useEffect(() => {
    return () => {
      onUserInput(Field.INPUT, "");
    };
  }, [onUserInput]);

  const unlockRemainBlocks = useMemo(() => {
    if (!position || !latestBlock) {
      return undefined;
    }

    if (position.lockUntil === 0) {
      return 0;
    }

    if (latestBlock > position.lockUntil) {
      return 0;
    }

    return position.lockUntil - latestBlock;
  }, [position, latestBlock]);

  const unlockMoment = useMemo(() => {
    console.log(unlockRemainBlocks);
    if (!unlockRemainBlocks) {
      return undefined;
    }

    const remainingMinutes = unlockRemainBlocks * BITCOIN_BLOCK_TIME_MINUTES;

    return moment().add(remainingMinutes, "minutes");
  }, [unlockRemainBlocks]);

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

  const runePriceInSats = useMemo(
    () =>
      pool
        ? getRunePriceInSats(
            formatCoinAmount(pool.coinA.balance, pool.coinA),
            formatCoinAmount(pool.coinB.balance, pool.coinB)
          )
        : undefined,
    [pool]
  );

  const btcPrice = useCoinPrice(pool?.coinA.id);

  return (
    <>
      <CoinField
        coin={pool?.coinA ?? null}
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
      <div className="flex justify-between items-start mt-4 relative min-h-6">
        {position?.lockUntil !== PERMANENT_LOCK_BLOCKS ? (
          <LockLpSelector onLockChange={handleLockChange} position={position} />
        ) : null}
        {unlockMoment &&
          (position?.lockUntil === PERMANENT_LOCK_BLOCKS ? (
            <span className="text-muted-foreground text-xs absolute right-0 top-2">
              {t("permanentlyLocked")}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs absolute right-0 top-2">
              {t("lpLockedUtil")} ~{unlockMoment?.format("YYYY-MM-DD HH:mm")}
            </span>
          ))}
      </div>
      <div className="mt-6">
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
            onClick={() =>
              onReview(
                isEmptyPool ? inputAmount : formattedAmounts[Field.INPUT],
                isEmptyPool ? outputAmount : formattedAmounts[Field.OUTPUT],
                deposit?.nonce ?? "0",
                deposit?.utxos ?? [],
                lockBlocks
              )
            }
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
      <div className="mt-4 flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("currencyReserves")}</span>
          <div className="flex flex-col items-end text-muted-foreground">
            <span>
              {pool
                ? formatCoinAmount(pool?.coinA.balance ?? "0", pool.coinA)
                : "-"}{" "}
              {getCoinSymbol(pool?.coinA)}
            </span>
            <span>
              {pool
                ? formatCoinAmount(pool?.coinB.balance ?? "0", pool.coinB)
                : "-"}{" "}
              {getCoinSymbol(pool?.coinB)}
            </span>
          </div>
        </div>
        {runePriceInSats && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("runePrice")}</span>
            <div className="flex flex-col items-end">
              <span>{runePriceInSats} sats</span>
              <span className="text-primary/80 text-xs">
                {btcPrice
                  ? `$${new Decimal(runePriceInSats)
                      .mul(btcPrice)
                      .div(Math.pow(10, 8))
                      .toFixed(4)}`
                  : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
