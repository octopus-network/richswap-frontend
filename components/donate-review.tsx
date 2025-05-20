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

import { useAddSpentUtxos, useRemoveSpentUtxos } from "@/store/spent-utxos";

import axios from "axios";
import Decimal from "decimal.js";
import { OKX } from "@omnisat/lasereyes";
import { getAddressType } from "@/lib/utils";
import { AddressType } from "@/types";
import { DoubleIcon } from "@/components/double-icon";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, getCoinSymbol } from "@/lib/utils";

import { useWalletBtcUtxos, useWalletRuneUtxos } from "@/hooks/use-utxos";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { donateTx } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { parseCoinAmount } from "@/lib/utils";
import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { BITCOIN, EXCHANGE_ID } from "@/lib/constants";
import { useAddTransaction } from "@/store/transactions";

export function DonateReview({
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  poolAddress,
  poolUtxos,
  onSuccess,
  onBack,
  nonce,
  showCancelButton = false,
}: {
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  poolAddress: string;
  poolUtxos?: UnspentOutput[];
  coinBAmount: string;
  onSuccess: () => void;
  onBack: () => void;
  nonce: string;
  showCancelButton?: boolean;
}) {
  const { address, paymentAddress, provider, signPsbt } = useLaserEyes(
    ({ address, paymentAddress, provider, signPsbt }) => ({
      address,
      paymentAddress,
      provider,
      signPsbt,
    })
  );
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
  const runeUtxos = useWalletRuneUtxos(coinB?.id);

  const coinAPrice = useCoinPrice(coinA?.id);
  const coinAFiatValue = useMemo(
    () =>
      coinAAmount && coinAPrice ? Number(coinAAmount) * coinAPrice : undefined,
    [coinAAmount, coinAPrice]
  );

  useEffect(() => {
    if (!toSpendUtxos.length || !paymentAddress) {
      setInitiatorUtxoProof(undefined);
      return;
    }

    const utxos = toSpendUtxos.filter(
      (utxo) => utxo.address === paymentAddress
    );

    axios
      .post(`/api/utxos/get-proof`, {
        address: paymentAddress,
        utxos,
      })
      .then((res) => res.data)
      .then((data) => {
        if (data.data) {
          setInitiatorUtxoProof(data.data);
        } else {
          setErrorMessage("Fetch proof failed");
        }
      })
      .catch(() => {
        setErrorMessage("Fetch proof failed");
      });
  }, [toSpendUtxos, paymentAddress]);

  useEffect(() => {
    if (
      !poolAddress ||
      !coinA ||
      !coinB ||
      !coinAAmount ||
      !coinBAmount ||
      !btcUtxos ||
      !runeUtxos?.length ||
      !poolUtxos ||
      step !== 0
    ) {
      return;
    }

    const genPsbt = async () => {
      const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));

      try {
        const tx = await donateTx({
          runeid: coinB.id,
          btcAmount: coinAAmountBigInt,
          btcUtxos,
          poolUtxos,
          poolAddress,
          address,
          paymentAddress,
          feeRate: recommendedFeeRate,
        });

        setPsbt(tx.psbt);
        setToSpendUtxos(tx.toSpendUtxos);
        setToSpendUtxos(tx.toSpendUtxos);
        setPoolSpendUtxos(tx.poolSpendUtxos);
        setPoolReceiveUtxos(tx.poolReceiveUtxos);
        setTxid(tx.txid);
        setInputCoins(tx.inputCoins);
        setOutputCoins(tx.outputCoins);
        setToSignInputs(tx.toSignInputs);
        setFee(tx.fee);
      } catch (err: any) {
        setErrorMessage(err.message || err.toString());
        console.log(err);
      }
    };
    genPsbt();
  }, [
    poolAddress,
    coinA,
    coinB,
    poolUtxos,
    coinAAmount,
    coinBAmount,
    btcUtxos,
    runeUtxos,
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
      !poolAddress ||
      !initiatorUtxoProof
    ) {
      return;
    }

    try {
      setStep(1);

      let signedPsbtHex = "";

      if (provider === OKX) {
        const psbtHex = psbt.toHex();

        signedPsbtHex = await window.okxwallet.bitcoin.signPsbt(psbtHex, {
          toSignInputs,
          autoFinalized: false,
        });
        console.log(signedPsbtHex);
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
        initiator_utxo_proof: [],
        intention_set: {
          tx_fee_in_sats: fee,
          initiator_address: paymentAddress,
          intentions: [
            {
              action: "donate",
              exchange_id: EXCHANGE_ID,
              input_coins: inputCoins,
              pool_utxo_spend: poolSpendUtxos,
              pool_utxo_receive: poolReceiveUtxos,
              output_coins: outputCoins,
              pool_address: poolAddress,
              action_params: "",
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
        coinAAmount,
        coinBAmount,
        utxos: toSpendUtxos,
        type: TransactionType.DONATE,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        t("success"),
        PopupStatus.SUCCESS,
        t("donateDescription", {
          amount: coinAAmount,
          poolName: getCoinSymbol(coinB),
        })
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

      <Button
        onClick={onBack}
        variant="secondary"
        className="text-destructive"
        size="lg"
      >
        {t("dismiss")}
      </Button>
    </div>
  ) : (
    <>
      <div className="flex justify-between items-center">
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
        <div className="flex text-muted-foreground">{t("donating")}</div>
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
            title={t("SignPsbt")}
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
