import { TransactionInfo, TransactionStatus } from "@/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useLatestBlock } from "@/hooks/use-latest-block";

const status2Label = (transaction: TransactionInfo, latestBlock: number) => {
  const { status, blockHeight } = transaction;
  if (status === TransactionStatus.BROADCASTED) {
    return "Broadcasted";
  } else if (status === TransactionStatus.CONFIRMING) {
    const diff =
      Math.max(latestBlock, blockHeight || 0) - (blockHeight || 0) + 1;
    return `Confirming(${diff}/4)`;
  } else if (status === TransactionStatus.FINALIZED) {
    return "Finalized";
  } else if (status === TransactionStatus.REJECTED) {
    return "Rejected";
  } else if (status === TransactionStatus.FAILED) {
    return "Failed";
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
  return (
    <Badge
      className={cn("px-1 py-0 font-normal", status2Color(transaction))}
      variant="outline"
    >
      {status2Label(transaction, latestBlock ?? 0)}
    </Badge>
  );
}
