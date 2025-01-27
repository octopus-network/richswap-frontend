import { Coin } from "@/types";
import { CoinIcon } from "./coin-icon";
import { cn } from "@/lib/utils";

export function DoubleIcon({
  coins,
  size = "md",
}: {
  coins: [Coin, Coin];
  size?: "md" | "lg" | "xl";
}) {
  return (
    <div className="flex gap-[3px] rounded-full">
      <CoinIcon
        coin={coins[0]}
        className={cn(
          "w-4 overflow-hidden object-cover rounded-none rounded-l-full object-left-top",
          size === "md" ? "size-8 w-4" : size === "lg" ? "size-10 w-5" : "size-12 w-6"
        )}
      />
      <CoinIcon
        coin={coins[1]}
        className={cn(
          "w-4 overflow-hidden object-cover rounded-none rounded-r-full object-right-bottom opacity-60",
          size === "md" ? "size-8 w-4" : size === "lg" ? "size-10 w-5" : "size-12 w-6"
        )}
      />
    </div>
  );
}
