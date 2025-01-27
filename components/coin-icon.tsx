import { Coin } from "@/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function CoinIcon({
  coin,
  className,
  size = "md",
}: {
  coin: Coin;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  return coin.icon ? (
    <Image
      src={coin.icon}
      alt={coin.name}
      width={128}
      height={128}
      className={cn(
        "rounded-full",
        size === "md" ? "size-8" : size === "lg" ? "size-10" : "size-12",
        className
      )}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 rounded-full bg-accent items-center justify-center relative",
        size === "md" ? "size-8" : size === "lg" ? "size-10" : "size-12",
        className
      )}
    >
      <span className="absolute">
        {coin.runeSymbol ?? coin.symbol.slice(0, 2)}
      </span>
    </div>
  );
}
