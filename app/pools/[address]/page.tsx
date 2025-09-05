"use client";

import Link from "next/link";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";

import { useParams } from "next/navigation";
import { Position, PoolInfo, UnspentOutput, DonateQuote } from "@/types";
import { useMemo, useEffect, useState } from "react";
import { Exchange } from "@/lib/exchange";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftRight, Loader2 } from "lucide-react";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { ExternalLink } from "lucide-react";
import { usePoolTvl, usePoolFee } from "@/hooks/use-pools";
import { useCoinPrice } from "@/hooks/use-prices";
import { BITCOIN, RUNESCAN_URL, RICH_POOL } from "@/lib/constants";
import { ellipseMiddle, formatNumber } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Circle from "react-circle";

import { CLAIMABLE_PROTOCOL_FEE_THRESHOLD } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { formatCoinAmount, getCoinSymbol } from "@/lib/utils";
import { ManageLiquidityPanel } from "./manage-liquidity-panel";
import Decimal from "decimal.js";
import { useRee } from "@omnity/ree-client-ts-sdk";
import { DonateState } from "@/types";

import { PopupStatus, useAddPopup } from "@/store/popups";

export default function Pool() {
  const t = useTranslations("Pools");
  const { address } = useParams();

  const { createTransaction } = useRee();

  const { paymentAddress, signPsbt } = useLaserEyes();

  const addPopup = useAddPopup();

  const [poolInfo, setPoolInfo] = useState<PoolInfo>();
  const [richPoolInfo, setRichPoolInfo] = useState<PoolInfo>();
  const [position, setPosition] = useState<Position | null>();
  const [protocolFeeOffer, setProtocolFeeOffer] = useState<{
    utxo: UnspentOutput;
    nonce: string;
    outputAmount: string;
  }>();

  const [claimAndDonating, setClaimAndDonating] = useState(false);

  const [donateQuote, setDonateQuote] = useState<DonateQuote>();

  const [lps, setLps] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      Exchange.getLps(address as string),
      Exchange.getPoolInfo(address as string),
      Exchange.preExtractFee(address as string).catch(() => undefined),
      Exchange.getPoolInfo(RICH_POOL),
    ]).then(([_lps, _poolInfo, _protocolFee, _richPoolInfo]) => {
      setLps(_lps);
      setPoolInfo(_poolInfo);
      setProtocolFeeOffer(_protocolFee);
      setRichPoolInfo(_richPoolInfo);
    });
  }, [address]);

  useEffect(() => {
    if (!protocolFeeOffer || !richPoolInfo) {
      setDonateQuote(undefined);
      return;
    }
    Exchange.preDonate(richPoolInfo, protocolFeeOffer.outputAmount).then(
      setDonateQuote
    );
  }, [protocolFeeOffer, richPoolInfo]);

  const btcPrice = useCoinPrice(BITCOIN.id);

  const poolTvl = usePoolTvl(poolInfo?.key);

  const poolTvlInBtc = useMemo(
    () =>
      poolTvl !== undefined && btcPrice !== undefined
        ? poolTvl / btcPrice
        : btcPrice
        ? poolTvl ?? 0 / btcPrice
        : undefined,
    [btcPrice, poolTvl]
  );

  const poolFee = usePoolFee(poolInfo?.key);

  const poolFeeInBtc = useMemo(
    () =>
      poolFee !== undefined && btcPrice !== undefined
        ? poolFee / btcPrice
        : btcPrice
        ? poolFee ?? 0 / btcPrice
        : undefined,
    [btcPrice, poolFee]
  );

  const poolFeeInSats = useMemo(
    () =>
      poolFeeInBtc !== undefined ? poolFeeInBtc * Math.pow(10, 8) : undefined,
    [poolFeeInBtc]
  );

  console.log("pool info", poolInfo);

  const protocolFeeValue = useMemo(
    () =>
      poolInfo?.protocolRevenue !== undefined && btcPrice
        ? new Decimal(poolInfo.protocolRevenue)
            .mul(btcPrice)
            .div(Math.pow(10, 8))
            .toNumber()
        : undefined,
    [poolInfo, btcPrice]
  );

  useEffect(() => {
    if (!paymentAddress || !poolInfo) {
      setPosition(undefined);
      return;
    }
    Exchange.getPosition(poolInfo.address, paymentAddress).then(setPosition);
  }, [poolInfo, paymentAddress]);

  const claimAndDonate = async () => {
    if (
      !poolInfo ||
      donateQuote?.state !== DonateState.VALID ||
      !protocolFeeOffer
    ) {
      return;
    }

    setClaimAndDonating(true);

    try {
      const tx = await createTransaction();

      tx.addIntention({
        action: "extract_protocol_fee",
        poolAddress: poolInfo.address,
        poolUtxos: [protocolFeeOffer.utxo],
        inputCoins: [],
        outputCoins: [
          {
            to: RICH_POOL,
            coin: {
              id: BITCOIN.id,
              value: BigInt(protocolFeeOffer.outputAmount ?? "0"),
            },
          },
        ],
        nonce: BigInt(protocolFeeOffer.nonce ?? "0"),
      });

      tx.addIntention({
        action: "donate",
        poolAddress: RICH_POOL,
        poolUtxos: donateQuote.utxos,
        inputCoins: [
          {
            from: poolInfo.address,
            coin: {
              id: BITCOIN.id,
              value: BigInt(donateQuote.coinAAmount),
            },
          },
        ],
        outputCoins: [],
        nonce: BigInt(donateQuote.nonce ?? "0"),
      });

      const psbt = await tx.build();

      const psbtBase64 = psbt.toBase64();
      const res = await signPsbt(psbtBase64);
      const signedPsbtHex = res?.signedPsbtHex ?? "";

      if (!signedPsbtHex) {
        throw new Error("Signed Failed");
      }

      await tx.send(signedPsbtHex);

      addPopup(t("success"), PopupStatus.SUCCESS, t("claimAndDonateSuccess"));

      window.location.reload();
    } catch (err: any) {
      console.log(err);
      addPopup(t("failed"), PopupStatus.ERROR, err.message ?? "Unknown Error");
    } finally {
      setClaimAndDonating(false);
    }
  };

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="justify-between flex">
          <div className="flex items-center gap-2">
            {poolInfo ? (
              <>
                <Link href="/pools">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="size-4" />
                    {t("back")}
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">{poolInfo.name}</span>
                </div>
              </>
            ) : (
              <Skeleton className="h-9 w-48" />
            )}
          </div>
          {poolInfo && (
            <Link
              href={`/swap?coinA=${getCoinSymbol(
                poolInfo.coinA
              )}&coinB=${getCoinSymbol(poolInfo.coinB)}`}
              className="text-primary/80 hover:text-primary ml-3 inline-flex items-center"
            >
              <ArrowLeftRight className="mr-1 size-4" /> {t("swap")}
            </Link>
          )}
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-5 md:grid-cols-9 gap-4">
            <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-5">
              {poolInfo ? (
                <ManageLiquidityPanel pool={poolInfo} position={position} />
              ) : (
                <div className="flex flex-col">
                  <Skeleton className="w-full h-60" />
                  <Skeleton className="w-full h-10 mt-6 rounded-xl" />
                </div>
              )}
            </div>
            <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-5 md:col-span-4 ">
              <div className="font-semibold text-lg">{t("poolInfo")}</div>
              <div className="mt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("rune")}</span>
                  {poolInfo ? (
                    <div className="flex items-center gap-1">
                      <CoinIcon coin={poolInfo.coinB} size="sm" />
                      <Link
                        href={`${RUNESCAN_URL}/runes/${poolInfo.name}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 group hover:underline"
                      >
                        <span>{poolInfo.name}</span>
                        <ExternalLink className="text-muted-foreground size-3 group-hover:text-foreground" />
                      </Link>
                    </div>
                  ) : (
                    <Skeleton className="h-6 w-24" />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tvl")}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolTvlInBtc ? (
                      <Link
                        href={`${RUNESCAN_URL}/exchange/RICH_SWAP/pool/${poolInfo?.address}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 group hover:underline"
                      >
                        <span>{formatNumber(poolTvlInBtc)} ₿</span>
                        <ExternalLink className="text-muted-foreground size-3 group-hover:text-foreground" />
                      </Link>
                    ) : (
                      <Skeleton className="h-6 w-24" />
                    )}
                    {poolTvl ? (
                      <span className="text-muted-foreground truncate">
                        ${formatNumber(poolTvl)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-12" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("fee")}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolFeeInSats !== undefined ? (
                      <span>{formatNumber(poolFeeInSats, true)} sats</span>
                    ) : (
                      <Skeleton className="h-6 w-24" />
                    )}
                    {poolFee !== undefined ? (
                      <span className="text-muted-foreground truncate">
                        ${formatNumber(poolFee, true)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-12" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("currencyReserves")}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolInfo ? (
                      <span>
                        {formatCoinAmount(
                          poolInfo.coinA.balance ?? "0",
                          poolInfo.coinA
                        )}{" "}
                        {getCoinSymbol(poolInfo?.coinA)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                    {poolInfo ? (
                      <span>
                        {formatCoinAmount(
                          poolInfo.coinB.balance ?? "0",
                          poolInfo.coinB
                        )}{" "}
                        {getCoinSymbol(poolInfo?.coinB)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-24" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("donation")}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    {poolInfo ? (
                      <span>
                        {formatCoinAmount(
                          poolInfo.coinADonation ?? "0",
                          poolInfo.coinA
                        )}{" "}
                        {getCoinSymbol(poolInfo?.coinA)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                    {poolInfo ? (
                      <span>
                        {formatCoinAmount(
                          poolInfo.coinBDonation ?? "0",
                          poolInfo.coinB
                        )}{" "}
                        {getCoinSymbol(poolInfo?.coinB)}
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-24" />
                    )}
                  </div>
                </div>
                {poolInfo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("protocolFee")}
                    </span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span>
                        {formatNumber(poolInfo.protocolRevenue ?? "0", true)}{" "}
                        sats
                      </span>
                      {protocolFeeValue !== undefined ? (
                        <span className="text-muted-foreground truncate">
                          ${formatNumber(protocolFeeValue, true)}
                        </span>
                      ) : (
                        <Skeleton className="h-5 w-12" />
                      )}
                      {Number(poolInfo.protocolRevenue ?? "0") <
                      CLAIMABLE_PROTOCOL_FEE_THRESHOLD ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              className=""
                              variant="outline"
                              size="xs"
                              disabled
                            >
                              {t("claimAndDonate")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {t("claimTips", {
                                amount: CLAIMABLE_PROTOCOL_FEE_THRESHOLD,
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          className=""
                          variant="outline"
                          size="xs"
                          onClick={claimAndDonate}
                          disabled={!donateQuote || claimAndDonating}
                        >
                          {claimAndDonating && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {t("claimAndDonate")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border bg-secondary/50 px-4 py-3 rounded-xl col-span-4 mt-4">
            <span className="font-semibold text-lg">
              {t("liquidityProviders")}
            </span>
            <div className="flex justify-between mt-3 text-muted-foreground text-sm">
              <span>{t("address")}</span>
              <span>{t("percentage")}</span>
            </div>
            <div className="flex flex-col gap-3 mt-3">
              {lps.length
                ? lps
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((lp) => (
                      <div className="flex justify-between" key={lp.address}>
                        <Link
                          href={`${RUNESCAN_URL}/address/${lp.address}`}
                          className="group hover:underline inline-flex items-center"
                          target="_blank"
                        >
                          <span>{ellipseMiddle(lp.address, 14)}</span>
                          <ExternalLink className="ml-1 size-3 group-hover:text-foreground text-muted-foreground" />
                        </Link>
                        <div className="flex items-center">
                          <Circle
                            progress={lp.percentage}
                            size="18"
                            lineWidth="60"
                            progressColor="#f6d75a"
                            bgColor="#4c9aff"
                            showPercentage={false}
                          />
                          <span className="ml-1">
                            {lp.percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))
                : [1, 2, 3, 4].map((idx) => (
                    <div className="flex justify-between" key={idx}>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
