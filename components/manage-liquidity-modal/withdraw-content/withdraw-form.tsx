import { Coin, Position } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { formatNumber, getCoinSymbol } from "@/lib/utils";
import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";
import { UnspentOutput } from "@/types";
import { Button } from "@/components/ui/button";
import { Info, Waves } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Exchange } from "@/lib/exchange";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/use-debounce";
import { useLatestBlock } from "@/hooks/use-latest-block";
import { BITCOIN_BLOCK_TIME_MINUTES } from "@/lib/constants";
import moment from "moment";

export function WithdrawForm({
  position,
  onReview,
}: {
  position: Position | null | undefined;
  onReview: (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[],
    sqrtK: bigint
  ) => void;
}) {
  const coinAPrice = useCoinPrice(position?.coinA?.id);
  const coinBPrice = useCoinPrice(position?.coinB?.id);
  const { data: latestBlock } = useLatestBlock();

  const [withdrawPercentage, setWithdrawPercentage] = useState(0);
  const [nonce, setNonce] = useState("0");
  const [utxos, setUtxos] = useState<UnspentOutput[]>([]);
  const [sqrtK, setSqrtK] = useState<bigint>();
  const [errorMessage, setErrorMessage] = useState("");
  const t = useTranslations("Pools");

  const [output, setOutput] = useState<{
    coinA: Coin;
    coinB: Coin;
    coinAAmount: string;
    coinBAmount: string;
  }>();

  const debouncedPercentage = useDebounce(withdrawPercentage, 200);

  useEffect(() => {
    if (!debouncedPercentage || !position) {
      setNonce("0");
      setUtxos([]);
      setOutput(undefined);
      setErrorMessage("");
      return;
    }

    const _sqrtK =
      (BigInt(debouncedPercentage) * BigInt(position.userShare)) / BigInt(100);

    setSqrtK(_sqrtK);

    Exchange.preWithdrawLiquidity(position.pool, position.userAddress, _sqrtK)
      .then((res) => {
        if (res) {
          setNonce(res.nonce);
          setUtxos(res.utxos);
          setOutput(res.output);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message);
      });
  }, [debouncedPercentage, position]);

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
    if (!unlockRemainBlocks) {
      return undefined;
    }

    const remainingMinutes = unlockRemainBlocks * BITCOIN_BLOCK_TIME_MINUTES;

    return moment().add(remainingMinutes, "minutes");
  }, [unlockRemainBlocks]);

  return (
    <div>
      {position ? (
        <>
          <span className="text-muted-foreground">{t("pooledTokens")}</span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex-1 bg-secondary rounded-lg px-3 py-2 flex justify-between items-center">
              <div className="flex flex-col space-y-0">
                <span className="font-semibold text-lg">
                  {position.coinAAmount} {position.coinA?.symbol}
                </span>
                <span className="text-sm text-muted-foreground">
                  {coinAPrice
                    ? `$${formatNumber(
                        new Decimal(position.coinAAmount)
                          .mul(coinAPrice)
                          .toNumber()
                      )}`
                    : "-"}
                </span>
              </div>
              {position.coinA && (
                <CoinIcon coin={position.coinA} className="size-9" />
              )}
            </div>
            <div className="flex-1 bg-secondary rounded-lg px-3 py-2 flex justify-between items-center">
              <div className="flex flex-col space-y-0">
                <span className="font-semibold text-lg">
                  {position.coinBAmount} {position.coinB?.symbol}
                </span>
                <span className="text-sm text-muted-foreground">
                  {coinBPrice
                    ? `$${formatNumber(
                        new Decimal(position.coinBAmount)
                          .mul(coinBPrice)
                          .toNumber()
                      )}`
                    : "-"}
                </span>
              </div>
              {position.coinB && (
                <CoinIcon coin={position.coinB} className="size-9" />
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-muted-foreground">
              {t("withdrawPercentage")}
            </span>
            <div className="flex gap-2">
              <Slider
                defaultValue={[0]}
                max={100}
                step={1}
                disabled={Boolean(unlockRemainBlocks && unlockRemainBlocks > 0)}
                onValueChange={([value]) => setWithdrawPercentage(value)}
              />
              <span>{withdrawPercentage}%</span>
            </div>
            {unlockRemainBlocks && unlockRemainBlocks > 0 ? (
              <div className="text-sm text-destructive flex items-center">
                <Info className="mr-1 size-3" /> {t("lpLockedUtil")}{" "}
                ~{unlockMoment?.format("YYYY-MM-DD HH:mm")}
              </div>
            ) : null}
          </div>
          <Button
            className="mt-4 w-full"
            size="xl"
            disabled={!position || !Number(nonce) || !output || !utxos.length}
            onClick={() =>
              output && sqrtK
                ? onReview(
                    output.coinAAmount,
                    output.coinBAmount,
                    nonce,
                    utxos,
                    sqrtK
                  )
                : null
            }
          >
            {t(errorMessage ? errorMessage : "withdraw")}
          </Button>
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t("youWillReceive")}
              </span>
              {output ? (
                <div className="flex flex-col items-end">
                  <span>
                    {output.coinAAmount} {getCoinSymbol(output.coinA)}
                  </span>
                  <span>
                    {output.coinBAmount} {getCoinSymbol(output.coinB)}
                  </span>
                </div>
              ) : (
                "-"
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 flex items-center justify-center flex-col h-64">
          <Waves className="text-muted-foreground" />
          <div className="text-muted-foreground mt-2">{t("noPosition")}</div>
        </div>
      )}
    </div>
  );
}
