import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, TriangleAlert } from "lucide-react";
import {
  AddressType,
  Coin,
  InputCoin,
  OutputCoin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
} from "@/types";

import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { useAddSpentUtxos, useRemoveSpentUtxos } from "@/store/spent-utxos";
import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "@/components/coin-icon";
import { getAddressType } from "@/lib/utils";
import {
  formatNumber,
  getCoinSymbol,
  parseCoinAmount,
  getP2trAressAndScript,
  swapRuneTx,
  swapBtcTx,
} from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { useWalletBtcUtxos, useWalletRuneUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes";

import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { EXCHANGE_ID } from "@/lib/constants";
import { useAddTransaction } from "@/store/transactions";

import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";

export function SwapReview({
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  poolKey,
  onSuccess,
  onBack,
  poolUtxos,
  nonce,
  showCancelButton = false,
  setIsSubmiting,
}: {
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  poolKey: string;
  coinBAmount: string;
  onSuccess: () => void;
  onBack: () => void;
  nonce: string;
  poolUtxos?: UnspentOutput[];
  showCancelButton?: boolean;
  setIsSubmiting: (isSubmiting: boolean) => void;
}) {
  const { address, signPsbt, paymentAddress } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();

  const [errorMessage, setErrorMessage] = useState("");
  const [txid, setTxid] = useState("");

  const [toSpendUtxos, setToSpendUtxos] = useState<UnspentOutput[]>([]);
  const [poolSpendUtxos, setPoolSpendUtxos] = useState<string[]>([]);
  const [poolReceiveUtxos, setPoolReceiveUtxos] = useState<string[]>([]);
  const [inputCoins, setInputCoins] = useState<InputCoin[]>([]);
  const [outputCoins, setOutputCoins] = useState<OutputCoin[]>([]);

  const addSpentUtxos = useAddSpentUtxos();
  const removeSpentUtxos = useRemoveSpentUtxos();
  const recommendedFeeRate = useRecommendedFeeRateFromOrchestrator();
  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();

  const btcUtxos = useWalletBtcUtxos();
  const runeUtxos = useWalletRuneUtxos(
    coinA?.id === BITCOIN.id ? undefined : coinA?.id
  );

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

  const [, btc, runeAmount, btcAmount] = useMemo(
    () =>
      coinA?.id === BITCOIN.id
        ? [coinB, coinA, coinBAmount, coinAAmount]
        : [coinA, coinB, coinAAmount, coinBAmount],
    [coinA, coinB, coinAAmount, coinBAmount]
  );

  const runePriceInSats = useMemo(
    () =>
      new Decimal(btcAmount).mul(Math.pow(10, 8)).div(runeAmount).toFixed(2),
    [runeAmount, btcAmount]
  );

  const btcPrice = useCoinPrice(btc?.id);

  useEffect(() => {
    if (
      !poolKey ||
      !coinA ||
      !coinB ||
      !coinAAmount ||
      !coinBAmount ||
      !btcUtxos?.length ||
      !poolUtxos?.length
    ) {
      return;
    }

    const genPsbt = async () => {
      const { address: poolAddress } = getP2trAressAndScript(poolKey);
      if (!poolAddress) {
        return;
      }

      const isSwapRune = coinA.id === BITCOIN.id;
      const involvedRune = isSwapRune ? coinB : coinA;

      const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
      const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

      if (isSwapRune) {
        try {
          const tx = await swapRuneTx({
            btcAmount: coinAAmountBigInt,
            runeid: involvedRune.id,
            runeAmount: coinBAmountBigInt,
            btcUtxos,
            poolUtxos,
            poolAddress,
            address,
            paymentAddress,
            feeRate: recommendedFeeRate,
          });

          setPsbt(tx.psbt);
          setToSpendUtxos(tx.toSpendUtxos);
          setPoolSpendUtxos(tx.poolSpendUtxos);
          setPoolReceiveUtxos(tx.poolReceiveUtxos);
          setTxid(tx.txid);
          setInputCoins(tx.inputCoins);
          setOutputCoins(tx.outputCoins);
        } catch (err) {
          console.log(err);
        }
      } else {
        if (!runeUtxos?.length) {
          return;
        }
        const _runeUtxos: UnspentOutput[] = [];

        const runeAmount = coinAAmountBigInt;

        for (let i = 0; i < runeUtxos.length; i++) {
          const v = runeUtxos[i];
          if (v.runes.length) {
            const balance = v.runes.find((r) => r.id == involvedRune.id);
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
              if (r.id == involvedRune.id) {
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
          const tx = await swapBtcTx({
            runeid: involvedRune.id,
            runeAmount: runeAmount,
            btcAmount: coinBAmountBigInt,
            btcUtxos,
            runeUtxos: _runeUtxos,
            poolUtxos,
            poolAddress,
            address,
            paymentAddress,
            feeRate: recommendedFeeRate,
          });

          setPsbt(tx.psbt);

          setToSpendUtxos(tx.toSpendUtxos);
          setPoolSpendUtxos(tx.poolSpendUtxos);
          setPoolReceiveUtxos(tx.poolReceiveUtxos);
          setTxid(tx.txid);
          setInputCoins(tx.inputCoins);
          setOutputCoins(tx.outputCoins);
        } catch (err) {
          console.log(err);
        }
      }
    };

    genPsbt();
  }, [
    poolKey,
    coinA,
    coinB,
    coinAAmount,
    coinBAmount,
    btcUtxos,
    runeUtxos,
    poolUtxos,
    paymentAddress,
    address,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (
      !psbt ||
      !coinA ||
      !coinB ||
      !poolUtxos?.length ||
      !poolKey ||
      !toSpendUtxos.length ||
      !poolSpendUtxos.length ||
      !poolReceiveUtxos.length ||
      !txid ||
      !inputCoins.length ||
      !outputCoins.length
    ) {
      return;
    }

    setIsSubmiting(true);
    try {
      const { address: poolAddress } = getP2trAressAndScript(poolKey);
      if (!poolAddress) {
        return;
      }

      const psbtBase64 = psbt.toBase64();
      setStep(1);

      console.log("swap psbt before sign:", psbt.toHex());
      const res = await signPsbt(psbtBase64);

      console.log("signedPsbtHex", res?.signedPsbtHex);

      if (!res?.signedPsbtHex) {
        throw new Error("Signed Failed");
      }

      addSpentUtxos(toSpendUtxos);

      setStep(2);

      await Orchestrator.invoke({
        intention_set: {
          initiator_address: paymentAddress,
          intentions: [
            {
              action: "swap",
              exchange_id: EXCHANGE_ID,
              input_coins: inputCoins,
              pool_utxo_spend: poolSpendUtxos,
              pool_utxo_receive: poolReceiveUtxos,
              output_coins: outputCoins,
              action_params: "",
              pool_address: poolAddress,
              nonce: BigInt(nonce),
            },
          ],
        },
        psbt_hex: res.signedPsbtHex,
      });

      addTransaction({
        txid,
        coinA,
        coinB,
        poolKey,
        coinAAmount,
        utxos: toSpendUtxos,
        coinBAmount,
        type: TransactionType.SWAP,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        "Success",
        PopupStatus.SUCCESS,
        `Swap ${coinAAmount} ${getCoinSymbol(
          coinA
        )} to ${coinBAmount} ${getCoinSymbol(coinB)}`
      );

      onSuccess();
    } catch (error: any) {
      console.log(error);
      if (error.code !== 4001) {
        setErrorMessage(error.message || "Unknown Error");
        removeSpentUtxos(toSpendUtxos);
      } else {
        setStep(0);
      }
    }
    setIsSubmiting(false);
  };

  const invalidAddressType = useMemo(() => {
    const paymentAddressType = getAddressType(paymentAddress);
    return (
      paymentAddressType !== AddressType.P2TR &&
      paymentAddressType !== AddressType.P2WPKH
    );
  }, [paymentAddress]);

  return errorMessage ? (
    <div className="flex flex-col gap-4">
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
      <div className="flex flex-col">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="font-semibold">
              {formatNumber(coinAAmount)} {getCoinSymbol(coinA)}
            </span>
            <span className="text-sm text-muted-foreground">
              {coinAFiatValue ? `$${formatNumber(coinAFiatValue)}` : "-"}
            </span>
          </div>
          {coinA && <CoinIcon size="lg" coin={coinA} />}
        </div>
        <div className="flex items-center my-4">
          <ArrowDown className="text-muted-foreground size-5" />
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="font-semibold">
              {formatNumber(coinBAmount)} {getCoinSymbol(coinB)}
            </span>
            <span className="text-sm text-muted-foreground">
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rune Price</span>
              <div className="flex flex-col items-end">
                <span>
                  {runePriceInSats}{" "}
                  <em className="text-muted-foreground">sats</em>
                </span>
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fee rate</span>
              <span>
                ≈{recommendedFeeRate}{" "}
                <em className="text-muted-foreground">sats/vb</em>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network cost</span>
              <span>-</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col space-y-3">
            <Button
              size="xl"
              className="w-full"
              onClick={onSubmit}
              disabled={!psbt || invalidAddressType}
            >
              {!psbt && <Loader2 className="size-4 animate-spin" />}
              {!psbt
                ? "Generating PSBT"
                : invalidAddressType
                ? "Unsupported Address Type"
                : "Sign Transaction"}
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
