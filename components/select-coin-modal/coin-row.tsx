import { Coin } from "@/types";
import { cn } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes";
import { CoinIcon } from "../coin-icon";
import { useCoinBalance } from "@/hooks/use-balance";
import { Skeleton } from "../ui/skeleton";

import { getCoinSymbol, getCoinName } from "@/lib/utils";

export function CoinRow({
  coin,
  onSelect,
}: {
  coin: Coin;
  onSelect: (coin: Coin) => void;
}) {
  const { address } = useLaserEyes();
  const coinBalance = useCoinBalance(coin.id);

  return (
    <div
      className={cn(
        "px-4 py-2 flex justify-between hover:bg-secondary/80 cursor-pointer transition-colors duration-200"
      )}
      onClick={() => onSelect(coin)}
    >
      <div className="flex items-center">
        <CoinIcon coin={coin} className="size-9" />
        <div className="flex-col flex ml-3">
          <div className="flex items-center h-full">
            <span className="font-semibold text-sm">{getCoinSymbol(coin)}</span>
          </div>
          <span className="text-muted-foreground text-xs h-full">
            {getCoinName(coin)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center">
        {address && coinBalance === undefined ? (
          <>
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-16 h-3 mt-1" />
          </>
        ) : coinBalance !== undefined ? (
          <>
            <span className="text-sm">{coinBalance}</span>
            <span className="text-xs text-muted-foreground">-</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
