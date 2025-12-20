import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  Loader2,
  TriangleAlert,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { OKX } from "@omnisat/lasereyes-react";
import {
  AddressType,
  Coin,
  TransactionStatus,
  TransactionType,
  UnspentOutput,
  ToSignInput,
  SwapQuote,
  SwapState,
  Intention,
} from "@/types";

import { useRecommendedFeeRateFromOrchestrator } from "@/hooks/use-fee-rate";

import { BITCOIN } from "@/lib/constants";
import { CoinIcon } from "@/components/coin-icon";
import { getAddressType, cn, getUtxoProof } from "@/lib/utils";
import {
  formatNumber,
  getCoinSymbol,
  parseCoinAmount,
  getP2trAressAndScript,
  swapRuneTx,
  swapBtcTx,
  runeSwapRuneTx,
} from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useState, useMemo } from "react";
import * as bitcoin from "bitcoinjs-lib";
import { Step } from "@/components/step";
import { FileSignature, Shuffle } from "lucide-react";
import { useWalletBtcUtxos, useWalletRuneUtxos } from "@/hooks/use-utxos";
import { useLaserEyes } from "@omnisat/lasereyes-react";

import { Orchestrator } from "@/lib/orchestrator";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { Ellipsis } from "lucide-react";

import { useTranslations } from "next-intl";
import { useAddTransaction } from "@/store/transactions";

import { useCoinPrice } from "@/hooks/use-prices";
import Decimal from "decimal.js";
import { Skeleton } from "./ui/skeleton";

export function SwapReview({
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  onSuccess,
  onBack,
  swapQuote,
  showCancelButton = false,
  setIsSubmiting,
}: {
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  coinBAmount: string;
  onSuccess: () => void;
  onBack: () => void;
  swapQuote: SwapQuote | undefined;
  showCancelButton?: boolean;
  setIsSubmiting: (isSubmiting: boolean) => void;
}) {
  const { address, signPsbt, provider, paymentAddress } = useLaserEyes();
  const [step, setStep] = useState(0);
  const [psbt, setPsbt] = useState<bitcoin.Psbt>();
  const t = useTranslations("Swap");

  const [errorMessage, setErrorMessage] = useState("");
  const [txid, setTxid] = useState("");

  const [fee, setFee] = useState(BigInt(0));
  const [toSpendUtxos, setToSpendUtxos] = useState<UnspentOutput[]>([]);
  const [toSignInputs, setToSignInputs] = useState<ToSignInput[]>([]);
  const [initiatorUtxoProof, setInitiatorUtxoProof] = useState<number[]>();

  const [intentions, setIntentions] = useState<Intention[]>([]);

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

  const btcPrice = useCoinPrice(BITCOIN.id);

  const priceImpacts = useMemo(() => {
    if (!swapQuote?.routes?.length || !btcPrice) {
      return undefined;
    }
    const [route0, route1] = swapQuote.routes;

    const _priceImpacts = [
      {
        runeName: route0.pool.name,
        impact: route0.priceImpact,
        runePrice: (route0.runePriceInSats * btcPrice) / Math.pow(10, 8),
        runePriceInSats: route0.runePriceInSats,
      },
    ];

    if (route1) {
      _priceImpacts.push({
        runeName: route1.pool.name,
        impact: route1.priceImpact,
        runePrice: (route1.runePriceInSats * btcPrice) / Math.pow(10, 8),
        runePriceInSats: route1.runePriceInSats,
      });
    }

    return _priceImpacts;
  }, [swapQuote, btcPrice]);

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
      swapQuote?.state !== SwapState.VALID ||
      !coinA ||
      !coinB ||
      !coinAAmount ||
      !coinBAmount ||
      !btcUtxos ||
      step !== 0
    ) {
      return;
    }

    const genPsbt = async () => {
      if (!swapQuote.routes?.length) {
        return;
      }
      const route = swapQuote.routes[0];

      const { address: poolAddress } = getP2trAressAndScript(route.pool.key);
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
            nonce: BigInt(route.nonce),
            poolUtxos: route.poolUtxos,
            poolAddress,
            address,
            paymentAddress,
            feeRate: recommendedFeeRate,
          });

          setPsbt(tx.psbt);
          setToSpendUtxos(tx.toSpendUtxos);
          setTxid(tx.txid);
          setToSignInputs(tx.toSignInputs);
          setFee(tx.fee);
          setIntentions(tx.intentions);
        } catch (err: any) {
          setErrorMessage(err?.message || "Unknown Error");
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
            nonce: BigInt(route.nonce),
            poolUtxos: route.poolUtxos,
            poolAddress,
            address,
            paymentAddress,
            feeRate: recommendedFeeRate,
          });

          setPsbt(tx.psbt);

          setToSpendUtxos(tx.toSpendUtxos);
          setTxid(tx.txid);
          setToSignInputs(tx.toSignInputs);
          setFee(tx.fee);
          setIntentions(tx.intentions);
        } catch (err: any) {
          setErrorMessage(err?.message || "Unknown Error");
          console.log(err);
        }
      }
    };

    const genPsbtForRuneSwapRune = async () => {
      if (!swapQuote.routes?.length) {
        return;
      }
      try {
        if (!runeUtxos?.length) {
          return;
        }

        const coinAAmountBigInt = BigInt(parseCoinAmount(coinAAmount, coinA));

        const selectedRuneUtxos: UnspentOutput[] = [];

        const runeAmount = coinAAmountBigInt;
        const runeId = coinA.id;

        for (let i = 0; i < runeUtxos.length; i++) {
          const v = runeUtxos[i];
          if (v.runes.length) {
            const balance = v.runes.find((r) => r.id == runeId);
            if (balance && BigInt(balance.amount) == runeAmount) {
              selectedRuneUtxos.push(v);
              break;
            }
          }
        }

        if (selectedRuneUtxos.length == 0) {
          let total = BigInt(0);
          for (let i = 0; i < runeUtxos.length; i++) {
            const v = runeUtxos[i];
            v.runes.forEach((r) => {
              if (r.id == runeId) {
                total = total + BigInt(r.amount);
              }
            });
            selectedRuneUtxos.push(v);
            if (total >= runeAmount) {
              break;
            }
          }
        }

        const tx = await runeSwapRuneTx({
          runeA: coinA,
          runeB: coinB,
          runeUtxos: selectedRuneUtxos,
          btcUtxos,
          address,
          paymentAddress,
          swapQuote,
        });

        if (!tx) {
          return;
        }

        setPsbt(tx.psbt);

        setToSpendUtxos(tx.toSpendUtxos);
        setTxid(tx.txid);
        setToSignInputs(tx.toSignInputs);
        setFee(tx.fee);
        setIntentions(tx.intentions);
      } catch (err: any) {
        setErrorMessage(err?.message || "Unknown Error");
        console.log(err);
      }
    };

    if (swapQuote.routes?.length === 1) {
      genPsbt();
    } else {
      genPsbtForRuneSwapRune();
    }
  }, [
    coinA,
    coinB,
    coinAAmount,
    coinBAmount,
    btcUtxos,
    runeUtxos,
    swapQuote,
    paymentAddress,
    address,
    step,
    recommendedFeeRate,
  ]);

  const onSubmit = async () => {
    if (
      !psbt ||
      !coinA ||
      !coinB ||
      !toSpendUtxos.length ||
      !txid ||
      !intentions.length ||
      !initiatorUtxoProof
    ) {
      return;
    }

    setIsSubmiting(true);
    try {
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

      setStep(2);

      await Orchestrator.invoke({
        initiator_utxo_proof: initiatorUtxoProof,
        intention_set: {
          tx_fee_in_sats: fee,
          initiator_address: paymentAddress,
          intentions,
        },
        psbt_hex: signedPsbtHex,
        client_info: [
          JSON.stringify({
            client_type: "RICH_SWAP_FRONTEND",
            wallet_type: provider,
          }),
        ],
      });

      addTransaction({
        txid,
        coinA,
        coinB,
        coinAAmount,
        utxos: toSpendUtxos,
        coinBAmount,
        type: TransactionType.SWAP,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(
        t("success"),
        PopupStatus.SUCCESS,
        t("swapDescription", {
          coinA: getCoinSymbol(coinA),
          amountA: coinAAmount,
          coinB: getCoinSymbol(coinB),
          amountB: coinBAmount,
        })
      );

      onSuccess();
    } catch (error: any) {
      if (error.code !== 4001) {
        setErrorMessage(error.message || "Unknown Error");
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
      paymentAddressType !== AddressType.P2WPKH &&
      paymentAddressType !== AddressType.P2SH_P2WPKH
    );
  }, [paymentAddress]);

  const refreshQuoteError = useMemo(() => {
    return (
      errorMessage?.indexOf("404:") > -1 ||
      (errorMessage?.indexOf("599:") > -1 &&
        (errorMessage?.indexOf("Executing") > -1 ||
          errorMessage?.indexOf("pool state expired") > -1))
    );
  }, [errorMessage]);

  const checkLaterError = useMemo(() => {
    return errorMessage?.indexOf("409:007") > -1;
  }, [errorMessage]);

  const fetchUtxoProofFailedError = useMemo(() => {
    return errorMessage === "FETCH_UTXO_PROOF_FAILED";
  }, [errorMessage]);

  const onRefreshQuote = () => {
    setErrorMessage("");
    onBack();
    swapQuote?.refetch?.();
  };

  const onCheckLater = () => {
    setErrorMessage("");
    onBack();
  };

  return errorMessage ? (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg flex flex-col items-center">
        {refreshQuoteError ? (
          <RefreshCcw className="size-8 text-muted-foreground" />
        ) : checkLaterError ? (
          <Clock className="size-8 text-muted-foreground" />
        ) : (
          <TriangleAlert className="size-12 text-destructive" />
        )}
        <div className="mt-2 font-semibold">
          {refreshQuoteError
            ? t("refreshQuoteErrorTitle")
            : checkLaterError
            ? t("checkLaterErrorTitle")
            : t("error")}
        </div>
        <div className="break-all mt-2 text-sm text-center">
          {refreshQuoteError
            ? t("refreshQuoteErrorDescription")
            : checkLaterError
            ? t("checkLaterErrorDescription")
            : t(errorMessage)}
        </div>
      </div>

      {fetchUtxoProofFailedError ? (
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
      ) : refreshQuoteError ? (
        <Button
          onClick={onRefreshQuote}
          variant="secondary"
          size="lg"
          className="text-primary"
        >
          {t("refreshQuote")}
        </Button>
      ) : checkLaterError ? (
        <Button
          onClick={onCheckLater}
          variant="secondary"
          size="lg"
          className="text-primary"
        >
          {t("checkLater")}
        </Button>
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
      <div className="flex flex-col">
        <div className="flex justify-between h-11 items-center">
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
        <div className="flex justify-between h-11 items-center">
          {swapQuote?.state === SwapState.VALID ? (
            <div className="flex flex-col">
              <span className="font-semibold">
                {formatNumber(coinBAmount)} {getCoinSymbol(coinB)}
              </span>
              <span className="text-sm text-muted-foreground">
                {coinBFiatValue ? `$${formatNumber(coinBFiatValue)}` : "-"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-12 mt-1" />
            </div>
          )}
          {coinB && <CoinIcon size="lg" coin={coinB} />}
        </div>
      </div>
      <Separator className="my-4" />
      {step === 0 ? (
        <>
          <div className="space-y-1 text-sm">
            {priceImpacts && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {priceImpacts[0].runeName} {t("price")}
                  </span>
                  <div className="flex flex-col items-end">
                    <span>
                      {formatNumber(priceImpacts[0].runePriceInSats)} sats
                      <em
                        className={cn(
                          "ml-1",
                          priceImpacts[0].impact >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        ({priceImpacts[0].impact >= 0 && "+"}
                        {priceImpacts[0].impact.toFixed(2)}%)
                      </em>
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ${formatNumber(priceImpacts[0].runePrice)}
                    </span>
                  </div>
                </div>
                {priceImpacts[1] && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {priceImpacts[1].runeName} {t("price")}
                    </span>
                    <div className="flex flex-col items-end">
                      <span>
                        {formatNumber(priceImpacts[1].runePriceInSats)} sats
                        <em
                          className={cn(
                            "ml-1",
                            priceImpacts[1].impact >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          ({priceImpacts[1].impact >= 0 && "+"}
                          {priceImpacts[1].impact.toFixed(2)}%)
                        </em>
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        ${formatNumber(priceImpacts[1].runePrice)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("feeRate")}</span>
              <span>
                ≈{recommendedFeeRate}{" "}
                <em className="text-muted-foreground">sats/vb</em>
              </span>
            </div>
            <div className="flex justify-between">
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
              disabled={
                !psbt ||
                !initiatorUtxoProof ||
                invalidAddressType ||
                swapQuote?.state !== SwapState.VALID
              }
            >
              {!psbt || !initiatorUtxoProof ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {!psbt
                ? t("generatingPsbt")
                : invalidAddressType
                ? t("unsupportedAddressType")
                : initiatorUtxoProof
                ? t("signTransaction")
                : t("fetchingProof")}
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
