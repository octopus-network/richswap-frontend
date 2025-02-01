import { Position } from "@/types";
import { CoinIcon } from "@/components/coin-icon";
import { useCoinPrice } from "@/hooks/use-prices";
import { formatNumber } from "@/lib/utils";
import Decimal from "decimal.js";
import { UnspentOutput } from "@/types";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function WithdrawForm({
  position,
  onReview,
}: {
  position: Position | null | undefined;
  onReview: (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[]
  ) => void;
}) {
  const coinAPrice = useCoinPrice(position?.coinA?.id);
  const coinBPrice = useCoinPrice(position?.coinB?.id);

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
          <Button
            className="mt-4 w-full"
            size="xl"
            disabled={!position}
            onClick={() =>
              onReview(
                position.coinAAmount,
                position.coinBAmount,
                position.nonce,
                position.utxos
              )
            }
          >
            Withdraw
          </Button>
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
