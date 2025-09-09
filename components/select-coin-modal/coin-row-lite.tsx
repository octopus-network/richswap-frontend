import { Coin } from "@/types";
import { cn } from "@/lib/utils";
import { CoinIcon } from "../coin-icon";
import { memo, useMemo } from "react";
import { getCoinSymbol, getCoinName } from "@/lib/utils";

export const CoinRowLite = memo(function CoinRowLite({
  coin,
  onSelect,
}: {
  coin: Coin;
  onSelect: (coin: Coin) => void;
}) {
  const coinSymbol = useMemo(() => getCoinSymbol(coin), [coin]);
  const coinName = useMemo(() => getCoinName(coin), [coin]);

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
            <span className="font-semibold text-sm">{coinSymbol}</span>
          </div>
          <span className="text-muted-foreground text-xs h-full">{coinName}</span>
        </div>
      </div>
    </div>
  );
});

