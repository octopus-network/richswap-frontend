import { Coin, Position } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { formatNumber, getCoinSymbol } from "@/lib/utils";
import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import { UnspentOutput } from "@/types";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Exchange } from "@/lib/exchange";

import { useDebounce } from "@/hooks/use-debounce";

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

  const [withdrawPercentage, setWithdrawPercentage] = useState(0);
  const [nonce, setNonce] = useState("0");
  const [utxos, setUtxos] = useState<UnspentOutput[]>([]);
  const [sqrtK, setSqrtK] = useState<bigint>();

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
      return;
    }

    const _sqrtK =
      (BigInt(debouncedPercentage) * BigInt(position.userShare)) / BigInt(100);

    setSqrtK(_sqrtK);

    Exchange.preWithdrawLiquidity(
      position.poolKey,
      position.userAddress,
      _sqrtK
    ).then((res) => {
      if (res) {
        setNonce(res.nonce);
        setUtxos(res.utxos);
        setOutput(res.output);
      }
    });
  }, [debouncedPercentage, position]);

  console.log(output);

  return (
    <div>
      {position ? (
        <>
          <span className="text-muted-foreground">Pooled tokens</span>
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
            <span className="text-muted-foreground">Withdraw percentage</span>
            <div className="flex gap-2">
              <Slider
                defaultValue={[0]}
                max={100}
                step={1}
                onValueChange={([value]) => setWithdrawPercentage(value)}
              />
              <span>{withdrawPercentage}%</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            size="xl"
            disabled={!position || !Number(nonce) || !output || !utxos.length}
            onClick={() =>
              output && sqrtK
                ? onReview(output.coinAAmount, output.coinBAmount, nonce, utxos, sqrtK)
                : null
            }
          >
            Withdraw
          </Button>
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">You will receive</span>
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
          <div className="text-muted-foreground mt-2">No Position</div>
        </div>
      )}
    </div>
  );
}
