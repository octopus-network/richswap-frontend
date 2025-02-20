import { Button } from "@/components/ui/button";
import { ChevronLeft, TriangleAlert } from "lucide-react";
import {
  Coin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
} from "@/types";

import { useAddSpentUtxos, useRemoveSpentUtxos } from "@/store/spent-utxos";

import { DoubleIcon } from "@/components/double-icon";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";

import {
  formatNumber,
  getCoinSymbol,
  getP2trAressAndScript,
} from "@/lib/utils";

import { useWalletBtcUtxos, useWalletRuneUtxos } from "@/hooks/use-utxos";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { depositTx } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { parseCoinAmount } from "@/lib/utils";
import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { EXCHANGE_ID } from "@/lib/constants/canister";
import { useAddTransaction } from "@/store/transactions";

export function DepositReview({
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  poolKey,
  poolUtxos,
  onSuccess,
  onBack,
  nonce,
  showCancelButton = false,
}: {
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  poolKey: string;
  poolUtxos?: UnspentOutput[];
  coinBAmount: string;
  onSuccess: () => void;
  onBack: () => void;
  nonce: string;
  showCancelButton?: boolean;
}) {
  const { address, paymentAddress, signPsbt } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();

  const [errorMessage, setErrorMessage] = useState("");

  const [toSpendUtxos, setToSpendUtxos] = useState<UnspentOutput[]>([]);

  const addSpentUtxos = useAddSpentUtxos();
  const removeSpentUtxos = useRemoveSpentUtxos();
  const recommendedFeeRate = useRecommendedFeeRateFromOrchestrator();
  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();

  const btcUtxos = useWalletBtcUtxos();
  const runeUtxos = useWalletRuneUtxos(coinB?.id);

  const coinAPrice = useCoinPrice(coinA?.id);
  const coinAFiatValue = useMemo(
    () =>
      coinAAmount && coinAPrice ? Number(coinAAmount) * coinAPrice : undefined,
    [coinAAmount, coinAPrice]
  );

  const coinBPrice = useCoinPrice(coinB?.id);
  const coinBFiatValue = useMemo(
    () =>
      coinBAmount && coinBPrice ? Number(coinBAmount) * coinBPrice : undefined,
    [coinBAmount, coinBPrice]
  );

  useEffect(() => {
    if (
      !poolKey ||
      !coinA ||
      !coinB ||
      !coinAAmount ||
      !coinBAmount ||
      !btcUtxos?.length ||
      !runeUtxos?.length ||
      !poolUtxos
    ) {
      return;
    }

    const { address: poolAddress } = getP2trAressAndScript(poolKey);
    if (!poolAddress) {
      return;
    }

    const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
    const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

    const _runeUtxos: UnspentOutput[] = [];
    const runeAmount = coinBAmountBigInt;
    const runeid = coinB.id;

    for (let i = 0; i < runeUtxos.length; i++) {
      const v = runeUtxos[i];
      if (v.runes.length) {
        const balance = v.runes.find((r) => r.id == runeid);
        if (balance && BigInt(balance.amount) == runeAmount) {
          _runeUtxos.push(v);
          break;
        }
      }
    }

    if (_runeUtxos.length == 0) {
      let total = BigInt(0);
      for (let i = 0; i < runeUtxos.length; i++) {
        const v = runeUtxos[i];
        v.runes.forEach((r) => {
          if (r.id == runeid) {
            total = total + BigInt(r.amount);
          }
        });
        _runeUtxos.push(v);
        if (total >= runeAmount) {
          break;
        }
      }
    }

    try {
      const tx = depositTx({
        runeid: coinB.id,
        runeAmount,
        btcAmount: coinAAmountBigInt,
        btcUtxos,
        runeUtxos: _runeUtxos,
        poolUtxos,
        poolAddress,
        address,
        paymentAddress,
        feeRate: recommendedFeeRate,
      });

      console.log("tx", tx);

      setPsbt(tx.psbt);
      setToSpendUtxos(tx.toSpendUtxos);
    } catch (err) {
      console.log(err);
    }
  }, [
    poolKey,
    coinA,
    coinB,
    poolUtxos,
    coinAAmount,
    coinBAmount,
    btcUtxos,
    runeUtxos,
    address,
    paymentAddress,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (!psbt || !coinA || !coinB || !poolUtxos || !toSpendUtxos.length) {
      return;
    }

    try {
      const psbtBase64 = psbt.toBase64();

      console.log("Deposit Liquidity PSBT:", psbtBase64);

      setStep(1);

      const { address: poolAddress } = getP2trAressAndScript(poolKey);

      const signedRes = await signPsbt(psbtBase64);

      if (!signedRes?.signedPsbtHex) {
        throw new Error("Signed Failed");
      }

      addSpentUtxos(toSpendUtxos);

      setStep(2);

      const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
      const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

      let poolRuneAmount = BigInt(0);

      poolUtxos.forEach((utxo) => {
        const rune = utxo.runes.find((rune) => rune.id === coinB.id);
        poolRuneAmount += BigInt(rune!.amount);
      });

      const txid = await Orchestrator.invoke({
        instruction_set: {
          steps: [
            {
              method: "add_liquidity",
              exchange_id: EXCHANGE_ID,
              input_coins: [
                {
                  coin_balance: { id: coinA.id, value: coinAAmountBigInt },
                  owner_address: paymentAddress,
                },
                {
                  coin_balance: { id: coinB.id, value: coinBAmountBigInt },
                  owner_address: address,
                },
              ],
              output_coins: [
                {
                  coin_balance: {
                    id: coinB.id,
                    value: coinBAmountBigInt + poolRuneAmount,
                  },
                  owner_address: poolAddress!,
                },
              ],
              pool_key: [poolKey],
              nonce: [BigInt(nonce)],
            },
          ],
        },
        psbt_hex: signedRes.signedPsbtHex,
      });

      addTransaction({
        txid,
        coinA,
        coinB,
        poolKey,
        coinAAmount,
        coinBAmount,
        utxos: toSpendUtxos,
        type: TransactionType.ADD_LIQUIDITY,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        "Success",
        PopupStatus.SUCCESS,
        `Add liduiqity to ${getCoinSymbol(coinB)} Pool`
      );

      onSuccess();
    } catch (error: any) {
      console.log(error);
      if (error.code !== 4001) {
        setErrorMessage(error.message || error.toString());
        removeSpentUtxos(toSpendUtxos);
      } else {
        setStep(0);
      }
    }
  };

  return errorMessage ? (
    <div className="mt-4 flex flex-col gap-4">
      <div className="p-4 border rounded-lg flex flex-col items-center">
        <TriangleAlert className="size-12 text-destructive" />
        <div className="break-all mt-2 text-sm">{errorMessage}</div>
      </div>

      <Button
        onClick={onBack}
        variant="secondary"
        className="text-destructive"
        size="lg"
      >
        Dismiss
      </Button>
    </div>
  ) : (
    <>
      {!showCancelButton && (
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onBack}
            disabled={step !== 0}
            className="rounded-full size-8"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <div className="font-bold text-muted-foreground">Add Liquidity</div>
        </div>
      )}
      <div className="flex justify-between mt-3 items-center">
        {coinA && coinB && (
          <>
            <span className="font-bold text-xl">
              {coinA.symbol}/{getCoinSymbol(coinB)}
            </span>
            <DoubleIcon size="lg" coins={[coinA, coinB]} />
          </>
        )}
      </div>
      <div className="flex flex-col space-y-3 mt-3">
        <div className="flex text-muted-foreground">Depositing</div>
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="font-semibold">
              {formatNumber(coinAAmount)} {coinA && getCoinSymbol(coinA)}
            </span>
            <span className="text-muted-foreground">
              {coinAFiatValue ? `$${formatNumber(coinAFiatValue)}` : "-"}
            </span>
          </div>
          {coinA && <CoinIcon size="lg" coin={coinA} />}
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="font-semibold">
              {formatNumber(coinBAmount)} {coinB && getCoinSymbol(coinB)}
            </span>
            <span className="text-muted-foreground">
              {coinBFiatValue ? `$${formatNumber(coinBFiatValue)}` : "-"}
            </span>
          </div>
          {coinB && <CoinIcon size="lg" coin={coinB} />}
        </div>
      </div>
      <Separator className="my-4" />
      {step === 0 ? (
        <>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fee rate</span>
              <span>
                ≈{recommendedFeeRate}{" "}
                <em className="text-muted-foreground">sats/vb</em>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network cost</span>
              <span>$ -</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col space-y-3">
            <Button
              size="xl"
              className="w-full"
              onClick={onSubmit}
              disabled={!psbt}
            >
              {!psbt ? "Insufficient Utxos" : "Sign PSBT"}
            </Button>
            {showCancelButton && (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={onBack}
              >
                Cancel
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <Step
            title="Sign PSBT"
            description="Please confirm in wallet"
            icon={<FileSignature className="size-4" />}
            isActive={step === 1}
          />
          <Separator orientation="vertical" className="h-3 w-[2px] ml-[14px]" />
          <Step
            title="Invoke exchange"
            countdown={5}
            icon={<Shuffle className="size-4" />}
            isActive={step === 2}
          />
          <Separator orientation="vertical" className="h-3 w-[2px] ml-[14px]" />
          <Step
            title="Wait for confirmation"
            countdown={180}
            icon={<Ellipsis className="size-4" />}
            isActive={step === 3}
          />
        </div>
      )}
    </>
  );
}
