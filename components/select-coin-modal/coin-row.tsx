import { Coin } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { CoinIcon } from "../coin-icon";
import { useCoinBalance } from "@/hooks/use-balance";
import { Skeleton } from "../ui/skeleton";
import { useCoinPrice } from "@/hooks/use-prices";
import { useMemo, memo } from "react";
import { getCoinSymbol, getCoinName } from "@/lib/utils";

export const CoinRow = memo(function CoinRow({
  coin,
  onSelect,
}: {
  coin: Coin;
  onSelect: (coin: Coin) => void;
}) {
  const { address } = useLaserEyes();
  const coinBalance = useCoinBalance(coin);

  const coinPrice = useCoinPrice(coin?.id);

  const coinFiatValue = useMemo(
    () =>
      coinBalance && coinPrice ? Number(coinBalance) * coinPrice : undefined,
    [coinBalance, coinPrice]
  );

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
          <span className="text-muted-foreground text-xs h-full">
            {coinName}
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
            <span className="text-sm">{formatNumber(coinBalance)}</span>
            <span className="text-xs text-muted-foreground">
              {coinFiatValue !== undefined && coinFiatValue !== 0
                ? "$" + formatNumber(coinFiatValue)
                : "-"}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
});
