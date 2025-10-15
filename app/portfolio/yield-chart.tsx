import { formatNumber } from "@/lib/utils";
import { useMemo } from "react";

export default function YieldChart({
  yieldSats,
  yieldValue,
  claimable,
}: {
  yieldSats: number;
  yieldValue: number;
  claimable: number;
}) {
  const { progress, dashArray, dashOffset } = useMemo(() => {
    const total = Math.max(yieldSats, claimable);
    const ratio = total > 0 ? Math.min(claimable / total, 1) : 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    return {
      progress: ratio,
      dashArray: `${circumference} ${circumference}`,
      dashOffset: circumference * (1 - ratio),
    };
  }, [yieldSats, claimable]);

  return (
    <div className="relative flex h-[120px] w-[120px] items-center justify-center">
      <svg
        width={120}
        height={120}
        viewBox="0 0 120 120"
        className="-rotate-90 transform text-muted-foreground"
      >
        <circle
          cx={60}
          cy={60}
          r={52}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={12}
          className="opacity-20"
        />
        <circle
          cx={60}
          cy={60}
          r={52}
          fill="transparent"
          stroke="hsl(var(--chart-2))"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-base font-semibold text-foreground">
          {formatNumber(yieldSats, true)} sats
        </span>
        <span className="text-xs text-muted-foreground">
          ${formatNumber(yieldValue, true)}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wide text-primary/80">
          {formatNumber(progress * 100, true)}%
        </span>
      </div>
    </div>
  );
}
