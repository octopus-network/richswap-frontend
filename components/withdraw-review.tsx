import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import {
  Coin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
  InputCoin,
  OutputCoin,
  ToSignInput,
} from "@/types";

import { formatNumber, withdrawTx, getUtxoProof } from "@/lib/utils";
import { useCoinPrice } from "@/hooks/use-prices";
import { useAddSpentUtxos, useRemoveSpentUtxos } from "@/store/spent-utxos";

import { useTranslations } from "next-intl";
import { BITCOIN } from "@/lib/constants";
import { OKX, useLaserEyes } from "@omnisat/lasereyes-react";
import { Loader2 } from "lucide-react";
import { AddressType } from "@/types";
import { getAddressType } from "@/lib/utils";
import { DoubleIcon } from "@/components/double-icon";
import { CoinIcon } from "@/components/coin-icon";
import { getCoinSymbol, getP2trAressAndScript } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { useWalletBtcUtxos } from "@/hooks/use-utxos";

import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { parseCoinAmount } from "@/lib/utils";

import Decimal from "decimal.js";
import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { EXCHANGE_ID } from "@/lib/constants";
import { useAddTransaction } from "@/store/transactions";

export function WithdrawReview({
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  poolKey,
  poolUtxos,
  onSuccess,
  onBack,
  nonce,
  sqrtK,
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
  sqrtK: bigint | undefined;
  showCancelButton?: boolean;
}) {
  const { address, paymentAddress, provider, signPsbt } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();
  const t = useTranslations("Pools");
  const [errorMessage, setErrorMessage] = useState("");
  const [txid, setTxid] = useState("");

  const [fee, setFee] = useState(BigInt(0));
  const [toSpendUtxos, setToSpendUtxos] = useState<UnspentOutput[]>([]);
  const [toSignInputs, setToSignInputs] = useState<ToSignInput[]>([]);
  const [poolSpendUtxos, setPoolSpendUtxos] = useState<string[]>([]);
  const [poolReceiveUtxos, setPoolReceiveUtxos] = useState<string[]>([]);
  const [inputCoins, setInputCoins] = useState<InputCoin[]>([]);
  const [outputCoins, setOutputCoins] = useState<OutputCoin[]>([]);
  const [initiatorUtxoProof, setInitiatorUtxoProof] = useState<number[]>();

  const addSpentUtxos = useAddSpentUtxos();
  const removeSpentUtxos = useRemoveSpentUtxos();
  const recommendedFeeRate = useRecommendedFeeRateFromOrchestrator();
  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();

  const btcUtxos = useWalletBtcUtxos();

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

  const fetchUtxoProof = useCallback(() => {
    if (!toSpendUtxos.length || !paymentAddress) {
      setInitiatorUtxoProof(undefined);
      return;
    }

    const utxos = toSpendUtxos.filter(
      (utxo) => utxo.address === paymentAddress
    );

    getUtxoProof(utxos).then((proof) => {
      if (proof) {
        setInitiatorUtxoProof(proof);
      } else {
        setErrorMessage("FETCH_UTXO_PROOF_FAILED");
      }
    });
  }, [toSpendUtxos, paymentAddress]);

  useEffect(() => {
    fetchUtxoProof();
  }, [fetchUtxoProof]);

  useEffect(() => {
    if (
      !poolKey ||
      !coinA ||
      !coinB ||
      !coinAAmount ||
      !coinBAmount ||
      !btcUtxos?.length ||
      !poolUtxos ||
      step !== 0
    ) {
      return;
    }

    const genPsbt = async () => {
      const { address: poolAddress } = getP2trAressAndScript(poolKey);
      if (!poolAddress) {
        return;
      }

      const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
      const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

      try {
        const tx = await withdrawTx({
          btcAmount: coinAAmountBigInt,
          runeid: coinB.id,
          runeAmount: coinBAmountBigInt,
          btcUtxos,
          poolUtxos,
          poolAddress,
          address,
          paymentAddress,
          feeRate: recommendedFeeRate,
        });

        setPsbt(tx.psbt);
        setFee(tx.fee);
        setToSpendUtxos(tx.toSpendUtxos);
        setPoolSpendUtxos(tx.poolSpendUtxos);
        setPoolReceiveUtxos(tx.poolReceiveUtxos);
        setTxid(tx.txid);
        setInputCoins(tx.inputCoins);
        setOutputCoins(tx.outputCoins);
        setToSignInputs(tx.toSignInputs);
      } catch (err) {
        console.log(err);
      }
    };
    genPsbt();
  }, [
    poolKey,
    coinA,
    coinB,
    poolUtxos,
    coinAAmount,
    coinBAmount,
    btcUtxos,
    address,
    step,
    paymentAddress,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (
      !psbt ||
      !coinA ||
      !coinB ||
      !poolUtxos ||
      !toSpendUtxos.length ||
      !sqrtK ||
      !initiatorUtxoProof
    ) {
      return;
    }

    try {
      const { address: poolAddress } = getP2trAressAndScript(poolKey);
      if (!poolAddress) {
        return;
      }

      setStep(1);

      let signedPsbtHex = "";

      if (provider === OKX) {
        const psbtHex = psbt.toHex();

        signedPsbtHex = await window.okxwallet.bitcoin.signPsbt(psbtHex, {
          toSignInputs,
          autoFinalized: false,
        });
      } else {
        const psbtBase64 = psbt.toBase64();
        const res = await signPsbt(psbtBase64);
        signedPsbtHex = res?.signedPsbtHex ?? "";
      }

      if (!signedPsbtHex) {
        throw new Error("Signed Failed");
      }

      addSpentUtxos(toSpendUtxos);

      setStep(2);

      await Orchestrator.invoke({
        initiator_utxo_proof: initiatorUtxoProof,
        intention_set: {
          tx_fee_in_sats: fee,
          initiator_address: paymentAddress,
          intentions: [
            {
              action: "withdraw_liquidity",
              exchange_id: EXCHANGE_ID,
              input_coins: inputCoins,
              pool_utxo_spent: poolSpendUtxos,
              pool_utxo_received: poolReceiveUtxos,
              output_coins: outputCoins,
              pool_address: poolAddress,
              action_params: sqrtK.toString(),
              nonce: BigInt(nonce),
            },
          ],
        },
        psbt_hex: signedPsbtHex,
      });

      addTransaction({
        txid,
        coinA,
        coinB,
        utxos: toSpendUtxos,
        coinAAmount,
        coinBAmount,
        type: TransactionType.WITHDRAW_LIQUIDITY,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        t("success"),
        PopupStatus.SUCCESS,
        t("withdrawLiquidityDescription", {
          coinA: getCoinSymbol(coinA),
          amountA: coinAAmount,
          coinB: getCoinSymbol(coinB),
          amountB: coinBAmount,
          poolName: getCoinSymbol(coinB),
        })
      );

      onSuccess();
    } catch (error: any) {
      if (error.code !== 4001) {
        setErrorMessage(error.message || "Unknown Error");
        removeSpentUtxos(toSpendUtxos);
      } else {
        setStep(0);
      }
    }
  };

  const invalidAddressType = useMemo(() => {
    const paymentAddressType = getAddressType(paymentAddress);
    return (
      paymentAddressType !== AddressType.P2TR &&
      paymentAddressType !== AddressType.P2WPKH &&
      paymentAddressType !== AddressType.P2SH_P2WPKH
    );
  }, [paymentAddress]);

  const btcPrice = useCoinPrice(BITCOIN.id);

  return errorMessage ? (
    <div className="mt-4 flex flex-col gap-4">
      <div className="p-4 border rounded-lg flex flex-col items-center">
        <TriangleAlert className="size-12 text-destructive" />
        <div className="break-all mt-2 text-sm">{t(errorMessage)}</div>
      </div>

      {errorMessage === "FETCH_UTXO_PROOF_FAILED" ? (
        <>
          <Button
            onClick={() => {
              setErrorMessage("");
              fetchUtxoProof();
            }}
            size="lg"
          >
            {t("retry")}
          </Button>
          <Button onClick={onBack} variant="secondary" size="lg">
            {t("cancel")}
          </Button>
        </>
      ) : (
        <Button
          onClick={onBack}
          variant="secondary"
          className="text-destructive"
          size="lg"
        >
          {t("dismiss")}
        </Button>
      )}
    </div>
  ) : (
    <>
      <div className="flex justify-between mt-3 items-center">
        {coinA && coinB && (
          <>
            <span className="font-bold text-xl">
              {getCoinSymbol(coinA)}/{getCoinSymbol(coinB)}
            </span>
            <DoubleIcon size="lg" coins={[coinA, coinB]} />
          </>
        )}
      </div>
      <div className="flex flex-col space-y-3 mt-3">
        <div className="flex text-muted-foreground">{t("withdrawing")}</div>
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="font-semibold">
              {coinAAmount} {getCoinSymbol(coinA)}
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
              {coinBAmount} {getCoinSymbol(coinB)}
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
              <span className="text-muted-foreground">{t("feeRate")}</span>
              <span>
                ≈{recommendedFeeRate}{" "}
                <em className="text-muted-foreground">sats/vb</em>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("networkCost")}</span>
              <div className="flex flex-col items-end">
                <span>
                  {fee > 0 ? Number(fee) : "-"}{" "}
                  <em className="text-muted-foreground">sats</em>
                </span>
                <span className="text-primary/80 text-xs">
                  {btcPrice && fee > 0
                    ? `$${new Decimal(fee.toString())
                        .mul(btcPrice)
                        .div(Math.pow(10, 8))
                        .toFixed(4)}`
                    : ""}
                </span>
              </div>
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
                ? t("generatingPsbt")
                : invalidAddressType
                ? t("unsupportedAddressType")
                : t("signTransaction")}
            </Button>
            {showCancelButton && (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={onBack}
              >
                {t("cancel")}
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <Step
            title={t("signPsbt")}
            description={t("pleaseConfirmInWallet")}
            icon={<FileSignature className="size-4" />}
            isActive={step === 1}
          />
          <Separator orientation="vertical" className="h-3 w-[2px] ml-[14px]" />
          <Step
            title={t("invokeExchange")}
            countdown={5}
            icon={<Shuffle className="size-4" />}
            isActive={step === 2}
          />
          <Separator orientation="vertical" className="h-3 w-[2px] ml-[14px]" />
          <Step
            title={t("waitForConfirmation")}
            countdown={180}
            icon={<Ellipsis className="size-4" />}
            isActive={step === 3}
          />
        </div>
      )}
    </>
  );
}
