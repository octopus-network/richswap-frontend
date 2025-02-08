import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, TriangleAlert } from "lucide-react";
import {
  Coin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
} from "@/types";

import { useAddSpentUtxos, useRemoveSpentUtxos } from "@/store/spent-utxos";
import { ToSignInput } from "@/types";
import { DoubleIcon } from "@/components/double-icon";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";

import {
  formatNumber,
  getCoinSymbol,
  getP2trAressAndScript,
} from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { useUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";
import { parseCoinAmount, selectUtxos } from "@/lib/utils";
import { Transaction } from "@/lib/transaction";
import { UTXO_DUST } from "@/lib/constants";
import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";
import { EXCHANGE_ID } from "@/lib/constants/canister";
import { useAddTransaction } from "@/store/transactions";
import { RuneId, Runestone, none, Edict } from "runelib";

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
  const { address } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();

  const [errorMessage, setErrorMessage] = useState("");
  const [userUtxos, setUserUtxos] = useState<UnspentOutput[]>([]);

  const addSpentUtxos = useAddSpentUtxos();
  const removeSpentUtxos = useRemoveSpentUtxos();
  const recommendedFeeRate = useRecommendedFeeRateFromOrchestrator();
  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();

  const utxos = useUtxos(address);

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
      !poolUtxos
    ) {
      return;
    }

    const { address: poolAddress } = getP2trAressAndScript(poolKey);
    if (!poolAddress) {
      return;
    }

    const txFee = BigInt(Math.ceil(384 * (recommendedFeeRate ?? 10)));

    const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));
    const coinBAmountBigInt = BigInt(parseCoinAmount(coinBAmount, coinB));

    let btcAmount = BigInt(0),
      runeAmount = BigInt(0);

    const coinAUtxos = selectUtxos(utxos, coinA, coinAAmountBigInt + txFee);
    const coinBUtxos = selectUtxos(utxos, coinB, coinBAmountBigInt);

    coinAUtxos.forEach((utxo) => {
      btcAmount += BigInt(utxo.satoshis);
    });

    coinBUtxos.forEach((utxo) => {
      const rune = utxo.runes.find((rune) => rune.id === coinB.id);
      runeAmount += BigInt(rune!.amount);
    });

    const changeBtcAmount = btcAmount - (coinAAmountBigInt + txFee);
    const changeRuneAmount = runeAmount - coinBAmountBigInt;

    const _userUtxos = [...coinAUtxos, ...coinBUtxos];
    setUserUtxos(_userUtxos);

    let poolBtcAmount = BigInt(0),
      poolRuneAmount = BigInt(0);

    poolUtxos.forEach((utxo) => {
      const rune = utxo.runes.find((rune) => rune.id === coinB.id);
      poolRuneAmount += BigInt(rune!.amount);
      poolBtcAmount += BigInt(utxo.satoshis) - UTXO_DUST;
    });

    const [runeBlock, runeIdx] = coinB.id.split(":");

    const sendBtcAmount = coinAAmountBigInt + poolBtcAmount;

    const sendRuneAmount = coinBAmountBigInt + poolRuneAmount;

    const needChange = changeRuneAmount > 0;

    const edicts = needChange
      ? [
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            changeRuneAmount,
            0
          ),
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            sendRuneAmount,
            1
          ),
        ]
      : [
          new Edict(
            new RuneId(Number(runeBlock), Number(runeIdx)),
            sendRuneAmount,
            0
          ),
        ];

    console.log("edicts", edicts);

    const runestone = new Runestone(edicts, none(), none(), none());

    const inputUtxos = [..._userUtxos, ...poolUtxos];

    const tx = new Transaction();
    tx.setEnableRBF(false);
    tx.setFeeRate(10);

    inputUtxos.forEach((utxo) => {
      tx.addInput(utxo);
    });

    if (needChange) {
      // change runes
      tx.addOutput(address, UTXO_DUST);
    }

    // send runes and BTC
    tx.addOutput(
      poolAddress,
      poolUtxos.length ? sendBtcAmount + UTXO_DUST : sendBtcAmount
    );
    // change btc
    tx.addOutput(address, changeBtcAmount);

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
    poolUtxos,
    coinAAmount,
    coinBAmount,
    utxos,
    address,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (!psbt || !coinA || !coinB || !poolUtxos) {
      return;
    }

    try {
      const psbtHex = psbt.toHex();
      setStep(1);

      const { address: poolAddress } = getP2trAressAndScript(poolKey);

      const toSignInputs: ToSignInput[] = userUtxos.map((_, index) => ({
        address,
        index,
      }));

      const signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
        toSignInputs,
      });

      addSpentUtxos(userUtxos);

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
                  owner_address: address,
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
        `Add liduiqity to ${getCoinSymbol(coinB)} Pool`
      );

      onSuccess();
    } catch (error: any) {
      if (error.code !== 4001) {
        setErrorMessage(error.message || "Unknown Error");
        removeSpentUtxos(userUtxos);
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
