import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, TriangleAlert } from "lucide-react";
import {
  Coin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
} from "@/types";
import { ToSignInput } from "@/types";

import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "@/components/coin-icon";
import { formatNumber, getP2trAressAndScript } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { useUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useRecommendedFeeRate } from "@/hooks/use-fee-rate";
import { parseCoinAmount, selectUtxos } from "@/lib/utils";
import { Transaction } from "@/lib/transaction";
import { UTXO_DUST } from "@/lib/constants";
import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { EXCHANGE_ID } from "@/lib/constants/canister";
import { useAddTransaction } from "@/store/transactions";
import { RuneId, Runestone, none, Edict } from "runelib";
import { useCoinPrice } from "@/hooks/use-prices";

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
}) {
  const { address } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();

  const [errorMessage, setErrorMessage] = useState("");
  const [toSignInputs, setToSignInputs] = useState<ToSignInput[]>([]);

  const recommendedFeeRate = useRecommendedFeeRate();
  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();

  const { data: utxos } = useUtxos(address);

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
      !utxos?.length ||
      !poolUtxos?.length
    ) {
      return;
    }

    const { address: poolAddress } = getP2trAressAndScript(poolKey);
    if (!poolAddress) {
      return;
    }

    const txFee = BigInt(Math.ceil(374 * (recommendedFeeRate ?? 10)));

    const isSwapRune = coinA.id === BITCOIN.id;

    const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
    const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

    let btcAmount = BigInt(0),
      runeAmount = BigInt(0);

    const btcUtxos = selectUtxos(
      utxos,
      BITCOIN,
      isSwapRune ? coinAAmountBigInt + txFee : txFee
    );

    const runeUtxos = isSwapRune
      ? []
      : selectUtxos(utxos, coinA, coinAAmountBigInt);

    btcUtxos.forEach((utxo) => {
      btcAmount += BigInt(utxo.satoshis);
    });

    runeUtxos.forEach((utxo) => {
      runeAmount += BigInt(utxo.rune!.amount);
    });

    let changeBtcAmount =
      btcAmount - (isSwapRune ? coinAAmountBigInt + txFee + UTXO_DUST : txFee);

    const userUtxos = [...btcUtxos, ...runeUtxos];
    const _toSignInputs: ToSignInput[] = [];

    userUtxos.forEach((_, index) => {
      _toSignInputs.push({
        address,
        index,
      });
    });

    setToSignInputs(_toSignInputs);

    let poolBtcAmount = BigInt(0),
      poolRunesAmount = BigInt(0);

    poolUtxos.forEach((utxo) => {
      // pool have only one utxo now
      poolRunesAmount += BigInt(utxo.rune!.amount);
      poolBtcAmount += BigInt(utxo.satoshis) - UTXO_DUST;
    });

    const involvedRune = isSwapRune ? coinB : coinA;
    const [runeBlock, runeIdx] = involvedRune.id.split(":");

    const toSendRunesAmount = isSwapRune
      ? coinBAmountBigInt
      : coinAAmountBigInt;

    const toSendBtcAmount = isSwapRune ? coinAAmountBigInt : coinBAmountBigInt;

    const outputRunesAmount =
      (isSwapRune ? BigInt(0) : poolRunesAmount) + toSendRunesAmount;

    const changedRunesAmount =
      (isSwapRune ? poolRunesAmount : runeAmount) - toSendRunesAmount;

    const needChange = changedRunesAmount > 0;

    const edicts = needChange
      ? [
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            changedRunesAmount,
            0
          ),
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            outputRunesAmount,
            1
          ),
        ]
      : [
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            outputRunesAmount,
            0
          ),
        ];

    const runestone = new Runestone(edicts, none(), none(), none());

    const inputUtxos = [...utxos, ...poolUtxos];

    const tx = new Transaction();
    tx.setEnableRBF(false);
    tx.setFeeRate(10);

    // add inputs
    inputUtxos.forEach((utxo) => {
      tx.addInput(utxo);
    });

    const outputToPoolBtcAmount = isSwapRune
      ? coinAAmountBigInt + poolBtcAmount
      : poolBtcAmount - toSendBtcAmount;

    if (needChange) {
      tx.addOutput(
        isSwapRune ? poolAddress : address,
        isSwapRune ? outputToPoolBtcAmount + UTXO_DUST : UTXO_DUST
      );
    } else {
      changeBtcAmount += isSwapRune ? BigInt(0) : UTXO_DUST;
    }

    // send runes
    tx.addOutput(
      isSwapRune ? address : poolAddress,
      isSwapRune ? UTXO_DUST : outputToPoolBtcAmount + UTXO_DUST
    );

    // to user btc
    tx.addOutput(
      address,
      changeBtcAmount + (isSwapRune ? BigInt(0) : toSendBtcAmount)
    );

    // OP_RETURN
    tx.addScriptOutput(runestone.encipher(), BigInt(0));

    try {
      const _psbt = tx.toPsbt();
      setPsbt(_psbt);
      console.log("psbt", _psbt);
    } catch (error) {
      console.log("error", error);
    }
  }, [
    poolKey,
    coinA,
    coinB,
    coinAAmount,
    coinBAmount,
    utxos,
    poolUtxos,
    address,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (!psbt || !coinA || !coinB) {
      return;
    }

    try {
      const psbtHex = psbt.toHex();
      setStep(1);

      const signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
        toSignInputs: toSignInputs,
      });

      setStep(2);

      const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
      const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

      const txid = await Orchestrator.invoke({
        instruction_set: {
          steps: [
            {
              method: "swap",
              exchange_id: EXCHANGE_ID,
              input_coins: [
                {
                  coin_balance: { id: coinA.id, value: coinAAmountBigInt },
                  owner_address: address,
                },
                {
                  coin_balance: { id: coinB.id, value: coinBAmountBigInt },
                  owner_address: address,
                },
              ],
              output_coins: [],
              pool_key: [poolKey],
              nonce: [BigInt(nonce)],
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
        type: TransactionType.ADD_LIQUIDITY,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        "Success",
        PopupStatus.SUCCESS,
        `Add liduiqity to ${coinA.symbol}/${coinB.symbol} Pool`
      );

      onSuccess();
    } catch (error: any) {
      if (error.code !== 4001) {
        setErrorMessage(error.message || "Unknown Error");
      } else {
        setStep(0);
      }
    }
  };

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
              {formatNumber(coinAAmount)} {coinA?.symbol}
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
              {formatNumber(coinBAmount)} {coinB?.symbol}
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fee rate</span>
              <span>
                {recommendedFeeRate}{" "}
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
              {!psbt && <Loader2 className="animate-spin" />}
              Sign Transaction
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
            countdown={15}
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
