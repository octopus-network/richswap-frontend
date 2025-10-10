import { Position } from "@/types";

import { useState, useMemo, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { usePoolTvl } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { ManageLiquidityModal } from "@/components/manage-liquidity-modal";

import { useCoinPrice } from "@/hooks/use-prices";
import { useLatestBlock } from "@/hooks/use-latest-block";
import Decimal from "decimal.js";
import moment from "moment";
import { CoinIcon } from "@/components/coin-icon";
import {
  BITCOIN,
  RUNESCAN_URL,
  BITCOIN_BLOCK_TIME_MINUTES,
} from "@/lib/constants";
import { useTranslations } from "next-intl";
import LockLpButton from "./lock-lp-button";
import { Button } from "@/components/ui/button";
import { Exchange } from "@/lib/exchange";
import { useRee } from "@omnity/ree-client-ts-sdk";
import { useAddPopup, PopupStatus } from "@/store/popups";
import { useAddTransaction } from "@/store/transactions";
import { TransactionStatus, TransactionType } from "@/types";
import { useLaserEyes } from "@omnisat/lasereyes-react";

export function PortfolioRow({ position }: { position: Position }) {
  const [isClaiming, setIsClaiming] = useState(false);

  const [manageLiquidityModalOpen, setManageLiquidityModalOpen] =
    useState(false);

  const addPopup = useAddPopup();
  const addTransaction = useAddTransaction();
  const poolTvl = usePoolTvl(position.pool.key);
  const btcPrice = useCoinPrice(BITCOIN.id);
  const { data: latestBlock } = useLatestBlock();
  const t = useTranslations("Portfolio");

  const { signPsbt, paymentAddress } = useLaserEyes();

  const { createTransaction } = useRee();

  useEffect(() => {}, [position]);

  const positionPercentage = useMemo(
    () =>
      position
        ? new Decimal(position.userShare)
            .mul(100)
            .div(position.totalShare)
            .toFixed(4)
        : position === null
        ? null
        : undefined,
    [position]
  );

  const positionValue = useMemo(() => {
    return positionPercentage === undefined
      ? undefined
      : positionPercentage === null
      ? undefined
      : poolTvl
      ? new Decimal(poolTvl).mul(positionPercentage).div(100).toNumber()
      : undefined;
  }, [poolTvl, positionPercentage]);

  const positionValueInBtc = useMemo(
    () =>
      positionValue !== undefined && btcPrice !== undefined
        ? positionValue / btcPrice
        : btcPrice
        ? positionValue ?? 0 / btcPrice
        : undefined,
    [btcPrice, positionValue]
  );

  const positionYield = useMemo(
    () => (position ? position.userIncomes : undefined),
    [position]
  );

  // const positionRevenue = useMemo(
  //   () => (position ? position.lockedRevenue : undefined),
  //   [position]
  // );

  const positionYieldValue = useMemo(
    () =>
      positionYield && btcPrice
        ? new Decimal(positionYield)
            .mul(btcPrice)
            .div(Math.pow(10, 8))
            .toNumber()
        : undefined,
    [positionYield, btcPrice]
  );

  // const positionRevuenueValue = useMemo(
  //   () =>
  //     positionRevenue && btcPrice
  //       ? new Decimal(positionRevenue)
  //           .mul(btcPrice)
  //           .div(Math.pow(10, 8))
  //           .toNumber()
  //       : undefined,
  //   [positionRevenue, btcPrice]
  // );

  const poolAddress = useMemo(() => position.pool.address, [position]);

  const unlockRemainBlocks = useMemo(() => {
    if (!position || !latestBlock) {
      return undefined;
    }

    if (position.lockUntil === 0) {
      return 0;
    }

    if (latestBlock >= position.lockUntil) {
      return 0;
    }

    return position.lockUntil - latestBlock;
  }, [position, latestBlock]);

  const unlockMoment = useMemo(() => {
    if (unlockRemainBlocks === undefined) {
      return undefined;
    }

    const remainingMinutes = unlockRemainBlocks * BITCOIN_BLOCK_TIME_MINUTES;

    return moment().add(remainingMinutes, "minutes");
  }, [unlockRemainBlocks]);

  const onClaim = async () => {
    setIsClaiming(true);

    try {
      const preClaimRes = await Exchange.preClaimRevenue(
        position.pool,
        position.userAddress
      );

      if (!preClaimRes) {
        throw new Error("Pre Claim Revenue Failed");
      }

      const tx = await createTransaction();

      tx.addIntention({
        action: "claim_revenue",
        poolAddress: poolAddress,
        poolUtxos: preClaimRes.utxos,
        actionParams: paymentAddress,
        inputCoins: [
          {
            from: poolAddress,
            coin: {
              id: BITCOIN.id,
              value: BigInt(preClaimRes.output),
            },
          },
        ],
        outputCoins: [
          {
            to: paymentAddress,
            coin: {
              id: BITCOIN.id,
              value: BigInt(preClaimRes.output),
            },
          },
        ],
        nonce: BigInt(preClaimRes.nonce ?? "0"),
      });

      const { psbt, txid } = await tx.build();

      const psbtBase64 = psbt.toBase64();
      const res = await signPsbt(psbtBase64);
      const signedPsbtHex = res?.signedPsbtHex ?? "";

      if (!signedPsbtHex) {
        throw new Error("Signed Failed");
      }

      await tx.send(signedPsbtHex);

      addTransaction({
        txid,
        coinA: BITCOIN,
        coinB: position.pool.coinB,
        coinAAmount: preClaimRes.output,
        type: TransactionType.CLAIM_REVENUE,
        status: TransactionStatus.BROADCASTED,
      });

      addPopup(t("success"), PopupStatus.SUCCESS, t("claimRevenueSuccess"));
    } catch (err: any) {
      console.log(err);
      addPopup(t("failed"), PopupStatus.ERROR, err.message ?? "Unknown Error");
    }
    setIsClaiming(false);
  };

  return (
    <>
      <div className="grid grid-cols-12 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 bg-secondary/20 hover:bg-secondary cursor-pointer px-4 py-3 transition-colors">
        <div className="col-span-3 flex items-center">
          <div className="hidden sm:block mr-3">
            <CoinIcon size="lg" coin={position.pool.coinB} />
          </div>
          <div
            className="hidden sm:inline-flex flex-col space-y-1 w-full group"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(
                `${RUNESCAN_URL}/runes/${position.pool.coinB.name}`,
                "_blank"
              );
            }}
          >
            <div className="flex w-full items-center space-x-1 group-hover:underline">
              <span className="font-semibold text-sm truncate max-w-[85%]">
                {position.pool.name}
              </span>
              <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {position.pool.coinB.id}
            </span>
          </div>
          <div className="inline-flex sm:hidden flex-col space-y-1 w-full group">
            <div className="flex w-full items-center space-x-1">
              <span className="font-semibold text-sm truncate max-w-[85%]">
                {position.pool.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {position.pool.coinB.id}
            </span>
          </div>
        </div>
        <div className="col-span-2">
          {positionValue !== undefined && positionValueInBtc !== undefined ? (
            <>
              <div
                className="hidden sm:inline-flex flex-col space-y-1 group"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(
                    `${RUNESCAN_URL}/address/${poolAddress}`,
                    "_blank"
                  );
                }}
              >
                <div className="flex w-full items-center space-x-1 group-hover:underline">
                  <span className="font-semibold text-sm truncate">
                    {formatNumber(positionValueInBtc)} ₿
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(positionValue, true)}
                </span>
              </div>
              <div className="inline-flex sm:hidden flex-col space-y-1">
                <div className="flex w-full items-center space-x-1">
                  <span className="font-semibold text-sm truncate">
                    {formatNumber(positionValueInBtc)} ₿
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  ${formatNumber(positionValue, true)}
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-2">
          {positionYieldValue !== undefined && positionYield !== undefined ? (
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-sm truncate">
                {formatNumber(positionYield, true)}{" "}
                <em className="font-normal">sats</em>
              </span>
              <span className="text-muted-foreground text-xs">
                ${formatNumber(positionYieldValue, true)}
              </span>
            </div>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="col-span-2">
          {position.lockUntil === 0 ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : unlockMoment === undefined ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <div className="flex flex-col">
              <span className="text-sm">
                ~{unlockMoment.format("YYYY-MM-DD HH:mm")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("remain")} {unlockRemainBlocks} {t("blocks")}
              </span>
            </div>
          )}
        </div>
        <div className="col-span-3 hidden md:flex">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setManageLiquidityModalOpen(true)}
              size="sm"
            >
              {t("manage")}
            </Button>
            {Number(position.lockedRevenue) > 1000 ? (
              <Button size="sm" onClick={onClaim} disabled={isClaiming}>
                {isClaiming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Claim {formatNumber(position.lockedRevenue, true)} sats
              </Button>
            ) : position.lockUntil === 0 ? (
              <LockLpButton poolAddress={poolAddress} />
            ) : null}
          </div>
        </div>
      </div>
      <ManageLiquidityModal
        open={manageLiquidityModalOpen}
        position={position}
        poolAddress={position.pool.address}
        setOpen={setManageLiquidityModalOpen}
      />
    </>
  );
}
