import Link from "next/link";
import { RUNESCAN_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";
import Circle from "react-circle";
import { ellipseMiddle } from "@/lib/utils";
import { useMemo } from "react";
import {
  BITCOIN_BLOCK_TIME_MINUTES,
  PERMANENT_LOCK_BLOCKS,
} from "@/lib/constants";
import moment from "moment";
import { useLatestBlock } from "@/hooks/use-latest-block";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export default function LpRow({
  lp,
}: {
  lp: {
    address: string;
    percentage: number;
    lockUntil: number;
  };
}) {
  const t = useTranslations("Pools");
  const { data: latestBlock } = useLatestBlock();

  const unlockRemainBlocks = useMemo(() => {
    if (!latestBlock) {
      return undefined;
    }
    if (lp.lockUntil === 0) {
      return 0;
    }

    if (latestBlock >= lp.lockUntil) {
      return 0;
    }

    return lp.lockUntil - latestBlock;
  }, [lp, latestBlock]);

  const unlockMoment = useMemo(() => {
    if (unlockRemainBlocks === undefined) {
      return undefined;
    }

    const remainingMinutes = unlockRemainBlocks * BITCOIN_BLOCK_TIME_MINUTES;

    return moment().add(remainingMinutes, "minutes");
  }, [unlockRemainBlocks]);
  return (
    <div className="grid grid-cols-9" key={lp.address}>
      <div className="col-span-4">
        <Link
          href={`${RUNESCAN_URL}/address/${lp.address}`}
          className="group hover:underline inline-flex items-center break-all"
          target="_blank"
        >
          <span>{ellipseMiddle(lp.address, 14)}</span>
          <ExternalLink className="ml-1 size-3 group-hover:text-foreground text-muted-foreground" />
        </Link>
      </div>

      <div className="col-span-3">
        {lp.lockUntil === 0 || lp.lockUntil <= (latestBlock ?? 0) ? (
          <span className="text-sm text-muted-foreground">-</span>
        ) : unlockMoment === undefined ? (
          <Skeleton className="h-5 w-16" />
        ) : lp.lockUntil === PERMANENT_LOCK_BLOCKS ? (
          <div>
            <span className="text-sm text-muted-foreground">
              {t("permanentlyLocked")}
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-sm">
              ~{unlockMoment.format("YYYY-MM-DD HH:mm")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("remain")} {unlockRemainBlocks} {t("blocks")}
            </span>
          </div>
        )}
      </div>

      <div className="col-span-2 flex justify-end items-center">
        <Circle
          progress={lp.percentage}
          size="18"
          lineWidth="60"
          progressColor="#f6d75a"
          bgColor="#4c9aff"
          showPercentage={false}
        />
        <span className="ml-1">{lp.percentage.toFixed(2)}%</span>
      </div>
    </div>
  );
}
