import { Coin } from "@/types";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ORDINALS_URL = process.env.NEXT_PUBLIC_ORDINALS_URL!;

export function CoinIcon({
  coin,
  className,
  size = "md",
}: {
  coin: Coin;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <Avatar
      className={cn(
        size === "md" ? "size-8" : size === "lg" ? "size-10" : "size-12",
        className
      )}
    >
      <AvatarImage
        src={coin.icon ?? `${ORDINALS_URL}/content/${coin.etching}i0`}
      />
      <AvatarFallback className="bg-accent">
        {coin.runeSymbol ?? coin.symbol?.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}
