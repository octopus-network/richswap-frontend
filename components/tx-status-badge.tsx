import { TransactionInfo, TransactionStatus } from "@/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useLatestBlock } from "@/hooks/use-latest-block";
import { useTranslations } from "next-intl";

const status2Label = (transaction: TransactionInfo, latestBlock: number) => {
  const { status, blockHeight } = transaction;
  if (status === TransactionStatus.BROADCASTED) {
    return "broadcasted";
  } else if (status === TransactionStatus.CONFIRMING) {
    const diff =
      Math.max(latestBlock, blockHeight || 0) - (blockHeight || 0) + 1;
    return `confirming(${diff}/4)`;
  } else if (status === TransactionStatus.FINALIZED) {
    return "finalized";
  } else if (status === TransactionStatus.REJECTED) {
    return "rejected";
  } else if (status === TransactionStatus.FAILED) {
    return "failed";
  }
};

const status2Color = (transaction: TransactionInfo) => {
  const { status } = transaction;

  if (status === TransactionStatus.BROADCASTED) {
    return "text-yellow-400 bg-yellow-400/10";
  } else if (
    status === TransactionStatus.CONFIRMING ||
    status === TransactionStatus.FINALIZED
  ) {
    return "text-green-400 bg-green-400/10";
  } else if (status === TransactionStatus.REJECTED) {
    return "text-red-400 bg-red-400/10";
  }
};

export function TxStatusBadge({
  transaction,
}: {
  transaction: TransactionInfo;
}) {
  const { data: latestBlock } = useLatestBlock();
  const t = useTranslations("AccountSheet");
  return (
    <Badge
      className={cn("px-1 py-0 font-normal", status2Color(transaction))}
      variant="outline"
    >
      {t(status2Label(transaction, latestBlock ?? 0) ?? "unknown")}
    </Badge>
  );
}
