import { Button } from "@/components/ui/button";
import { ChevronLeft, TriangleAlert } from "lucide-react";
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

import Decimal from "decimal.js";
import { OKX } from "@omnisat/lasereyes";
import { getAddressType } from "@/lib/utils";
import { AddressType } from "@/types";
import { DoubleIcon } from "@/components/double-icon";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { Loader2 } from "lucide-react";

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
import { BITCOIN, EXCHANGE_ID } from "@/lib/constants";
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

  const [errorMessage, setErrorMessage] = useState("");
  const [txid, setTxid] = useState("");

  const [fee, setFee] = useState(BigInt(0));
  const [toSpendUtxos, setToSpendUtxos] = useState<UnspentOutput[]>([]);
  const [toSignInputs, setToSignInputs] = useState<ToSignInput[]>([]);
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
      !poolUtxos ||
      step !== 0
    ) {
      return;
    }

    const { address: poolAddress } = getP2trAressAndScript(poolKey);
    if (!poolAddress) {
      return;
    }

    const genPsbt = async () => {
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
        const tx = await depositTx({
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
    poolKey,
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
    if (!psbt || !coinA || !coinB || !poolUtxos || !toSpendUtxos.length) {
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
        console.log("is okx wallet", toSignInputs);
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
        intention_set: {
          initiator_address: paymentAddress,
          intentions: [
            {
              action: "add_liquidity",
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

  const invalidAddressType = useMemo(() => {
    const paymentAddressType = getAddressType(paymentAddress);
    return (
      paymentAddressType !== AddressType.P2TR &&
      paymentAddressType !== AddressType.P2WPKH
    );
  }, [paymentAddress]);

  const btcPrice = useCoinPrice(BITCOIN.id);

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
                ? "Generating PSBT"
                : invalidAddressType
                ? "Unsupported Address Type"
                : "Sign PSBT"}
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
