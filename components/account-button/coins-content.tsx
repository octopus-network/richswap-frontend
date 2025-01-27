import { TabsContent } from "@/components/ui/tabs";
import { Coin } from "@/types";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useCoinBalance } from "@/hooks/use-balance";
import { useDefaultCoins } from "@/hooks/use-coins";
import { CoinIcon } from "../coin-icon";
import { formatNumber, cn } from "@/lib/utils";

function CoinRow({ coin }: { coin: Coin }) {
  const { address } = useLaserEyes();
  const balance = useCoinBalance(address, coin.id);

  return (
    <div
      className={cn(
        "px-4 py-2 flex justify-between hover:bg-secondary cursor-pointer transition-colors duration-200"
      )}
    >
      <div className="flex items-center">
        <CoinIcon coin={coin} className="size-8" />
        <div className="flex-col flex ml-3">
          <span className="font-semibold">{coin.symbol}</span>
          <span className="text-muted-foreground text-sm">{coin.name}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span>{balance ? formatNumber(balance) : "-"}</span>
        <span className="text-sm text-muted-foreground">-</span>
      </div>
    </div>
  );
}

export function CoinsContent() {
  const coins = useDefaultCoins();
  return (
    <TabsContent value="coins" className="mt-0">
      <div>
        {Object.values(coins).map((coin) => (
          <CoinRow coin={coin} key={coin.id} />
        ))}
      </div>
    </TabsContent>
  );
}
