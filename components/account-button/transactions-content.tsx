import { TabsContent } from "@radix-ui/react-tabs";
import { useEffect, useMemo, useState } from "react";
import { cn, getCoinSymbol } from "@/lib/utils";
import { TransactionInfo, TransactionStatus, TransactionType } from "@/types";
import { useTransactions } from "@/store/transactions";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TxStatusBadge } from "../tx-status-badge";
import moment from "moment";
import { useUpdateTransactionStatus } from "@/store/transactions";
import { useLatestBlock } from "@/hooks/use-latest-block";

function TransactionRow({ transaction }: { transaction: TransactionInfo }) {
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const updateTransactionStatus = useUpdateTransactionStatus();

  const { data: latestBlock } = useLatestBlock();

  useEffect(() => {
    if (transaction.status === TransactionStatus.CONFIRMING && latestBlock) {
      const diff =
        Math.max(latestBlock, transaction.blockHeight || 0) -
        (transaction.blockHeight || 0) +
        1;

      if (diff > 4) {
        updateTransactionStatus({
          txid: transaction.txid,
          status: TransactionStatus.FINALIZED,
        });
      }
    }
  }, [transaction, latestBlock, updateTransactionStatus]);

  const title = useMemo(() => {
    const { type, coinA, coinB } = transaction;
    if (type === TransactionType.ADD_LIQUIDITY) {
      return `Add Liquidity to ${getCoinSymbol(coinB)} pool`;
    } else if (type === TransactionType.SWAP) {
      return `Swap ${getCoinSymbol(coinA)} to ${getCoinSymbol(coinB)}`;
    } else if (type === TransactionType.WITHDRAW_LIQUIDITY) {
      return `Withdraw Liquidity from ${getCoinSymbol(coinB)} pool`;
    }
  }, [transaction]);

  const description = useMemo(() => {
    const { type, coinA, coinAAmount, coinB, coinBAmount } = transaction;
    if (type === TransactionType.ADD_LIQUIDITY) {
      return `With ${coinAAmount} ${getCoinSymbol(
        coinA
      )} and ${coinBAmount} ${getCoinSymbol(coinB)}`;
    } else if (type === TransactionType.SWAP) {
      return `Convert ${coinAAmount} ${getCoinSymbol(
        coinA
      )} to ${coinBAmount} ${getCoinSymbol(coinB)}`;
    } else if (type === TransactionType.WITHDRAW_LIQUIDITY) {
      return `Widthdraw ${coinAAmount} ${getCoinSymbol(
        coinA
      )} and ${coinBAmount} ${getCoinSymbol(coinB)}`;
    }
  }, [transaction]);

  const onClick = () => {
    if (
      transaction.status === TransactionStatus.CONFIRMING ||
      transaction.status === TransactionStatus.FINALIZED ||
      transaction.status === TransactionStatus.BROADCASTED
    ) {
      window.open(`https://mempool.space/tx/${transaction.txid}`, "_blank");
    } else if (transaction.status === TransactionStatus.REJECTED) {
      setShowErrorMessage((prev) => !prev);
    }
  };
  return (
    <div
      className={cn(
        "px-4 py-2 flex space-y-1 flex-col hover:bg-secondary cursor-pointer transition-colors duration-200"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm truncate">{title}</span>
        <div className="flex items-center space-x-1">
          <TxStatusBadge transaction={transaction} />
          {transaction.status === TransactionStatus.REJECTED ? (
            showErrorMessage ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )
          ) : null}
        </div>
      </div>
      {showErrorMessage && (
        <div className="border rounded-sm bg-red-300/10 px-2 py-1 text-sm">
          {transaction.message || "Unknown Error"}
        </div>
      )}
      <div className="flex justify-between items-center gap-3">
        <span className="text-xs text-muted-foreground truncate">{description}</span>
        <span className="text-xs text-muted-foreground truncate">
          {moment(transaction.timestamp).fromNow()}
        </span>
      </div>
    </div>
  );
}

export function TransactionsContent() {
  const transactions = useTransactions();
  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp),
    [transactions]
  );
  return (
    <TabsContent value="transactions" className="mt-0">
      {sortedTransactions.map((transaction) => (
        <TransactionRow transaction={transaction} key={transaction.txid} />
      ))}
    </TabsContent>
  );
}
