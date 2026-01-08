import { TabsContent } from "@/components/ui/tabs";
import { useTrades, TradeIntention } from "@/hooks/use-trades";
import { Coin } from "@/types";
import { usePoolList } from "@/hooks/use-pools";
import { useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatNumber } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { BITCOIN, RUNESCAN_URL } from "@/lib/constants";
import Decimal from "decimal.js";
import { useTranslations, useFormatter } from "next-intl";
import { useCoinPrice } from "@/hooks/use-prices";
import { CoinIcon } from "@/components/coin-icon";
import { Badge } from "@/components/ui/badge";

type SortField = "time" | "amount";
type SortOrder = "asc" | "desc";

function getTradeType(trade: TradeIntention): "buy" | "sell" {
  return trade.input_coins.some((c) => c.id === BITCOIN.id) ? "buy" : "sell";
}

function getRuneAmount(trade: TradeIntention): string {
  const type = getTradeType(trade);
  if (type === "buy") {
    const rune = trade.output_coins.find((c) => c.id !== BITCOIN.id);
    return rune?.value || "0";
  } else {
    const rune = trade.input_coins.find((c) => c.id !== BITCOIN.id);
    return rune?.value || "0";
  }
}

function getBtcAmount(trade: TradeIntention): string {
  const type = getTradeType(trade);
  if (type === "buy") {
    const btc = trade.input_coins.find((c) => c.id === BITCOIN.id);
    return btc?.value || "0";
  } else {
    const btc = trade.output_coins.find((c) => c.id === BITCOIN.id);
    return btc?.value || "0";
  }
}

function StatusBadge({ statusInfo }: { statusInfo: string }) {
  const t = useTranslations("AccountSheet");
  if (!statusInfo) {
    return null;
  }
  let status = "pending";

  if (statusInfo.startsWith("Confirmed")) {
    status = "confirmed";
    const blocks = Number(statusInfo.split(": ")[1]);
    if (!Number.isNaN(blocks)) {
      if (blocks >= 4) {
        status = "finalized";
      } else if (blocks > 0) {
        status = "confirmed";
      }
    }
  } else if (statusInfo.startsWith("Rejected")) {
    status = "rejected";
  }

  return (
    <Badge
      className={cn(
        "px-1 py-0 font-normal border-none",
        {
          pending: "text-yellow-400",
          confirmed: "text-green-400",
          finalized: "text-green-400",
          rejected: "text-red-400",
        }[status]
      )}
      variant="outline"
    >
      {t(status)}
    </Badge>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp
          className={cn(
            "size-3 -mb-1",
            isActive && currentOrder === "asc"
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        />
        <ChevronDown
          className={cn(
            "size-3 -mt-1",
            isActive && currentOrder === "desc"
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        />
      </span>
    </button>
  );
}

function TradeRow({
  trade,
  rune,
}: {
  trade: TradeIntention;
  rune: Coin | undefined;
}) {
  const type = getTradeType(trade);
  const runeAmount = getRuneAmount(trade);
  const btcAmount = getBtcAmount(trade);

  const formattedRuneAmount = useMemo(
    () =>
      rune
        ? new Decimal(runeAmount).div(Math.pow(10, rune.decimals)).toNumber()
        : 0,
    [runeAmount, rune]
  );

  const formattedBtcAmount = useMemo(
    () => new Decimal(btcAmount).div(1e8).toNumber(),
    [btcAmount]
  );

  const t = useTranslations("Swap");
  const format = useFormatter();

  const btcPrice = useCoinPrice(BITCOIN.id);

  const runePriceInSats = new Decimal(btcAmount).div(formattedRuneAmount).toNumber();
  const runePrice = useMemo(
    () => (runePriceInSats * btcPrice) / Math.pow(10, 8),
    [runePriceInSats, btcPrice]
  );

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 py-2 items-center text-sm hover:bg-secondary/30 gap-3">
      <div className="flex items-center gap-1">
        {type === "buy" ? (
          <>
            <ArrowUp className="size-3 text-green-500" />
            <span className="text-green-500">{t("buy")}</span>
          </>
        ) : (
          <>
            <ArrowDown className="size-3 text-red-500" />
            <span className="text-red-500">{t("sell")}</span>
          </>
        )}
      </div>
      <div className="flex-col flex">
        <span>{formatNumber(runePriceInSats)} sats</span>
        <span className="text-muted-foreground text-xs">
          ${formatNumber(runePrice)}
        </span>
      </div>
      <div className="justify-end items-center flex">
        <span className="text-md">{formatNumber(formattedRuneAmount)}</span>
        {rune && <CoinIcon coin={rune} className="size-4 ml-1" />}
      </div>
      <div className="text-right flex-col hidden sm:flex">
        <span>{formatNumber(formattedBtcAmount)} ₿</span>
        <span className="text-muted-foreground text-xs">
          ${formatNumber(formattedBtcAmount * btcPrice)}
        </span>
      </div>
      <div className="text-right text-muted-foreground">
        {format.relativeTime(
          new Date(trade.invoke_arg?.tx_sent?.time || 0),
          new Date()
        )}
      </div>
      <div className="items-center justify-end gap-1 hidden sm:flex">
        <StatusBadge
          statusInfo={trade.invoke_arg?.tx_sent?.status_info ?? "pending"}
        />
        <Link
          href={`${RUNESCAN_URL}/intention/${trade.invoke_args_tx_id}`}
          target="_blank"
        >
          <ExternalLink className="size-3 text-muted-foreground hover:text-foreground" />
        </Link>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function TradesContent({ rune }: { rune: string }) {
  const [sortBy, setSortBy] = useState<SortField>("time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);

  const poolList = usePoolList();

  const t = useTranslations("Swap");

  const pool = useMemo(() => {
    if (!rune) return;

    return poolList.find((p) => p.coinB.name === rune);
  }, [rune, poolList]);

  const { data, isLoading } = useTrades({
    poolAddress: pool?.address,
    sortBy: sortBy === "amount" ? "value" : "time",
    sortOrder,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = data?.total ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const runeCoin = pool?.coinB;

  return (
    <TabsContent value="trades" className="px-4 pb-4">
      <div className="grid grid-cols-4 sm:grid-cols-6 py-2 text-sm border-b border-border/50">
        <span className="text-muted-foreground">{t("type")}</span>
        <span className="text-muted-foreground">{t("price")}</span>
        <SortHeader
          label={t("amount")}
          field="amount"
          currentSort={sortBy}
          currentOrder={sortOrder}
          onSort={handleSort}
          className="justify-end"
        />
        <span className="text-muted-foreground text-right hidden sm:inline">
          {t("value")}
        </span>
        <SortHeader
          label={t("time")}
          field="time"
          currentSort={sortBy}
          currentOrder={sortOrder}
          onSort={handleSort}
          className="justify-end"
        />
        <span className="text-muted-foreground hidden sm:inline text-right">
          {t("status")}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 py-2">
          {[1, 2, 3, 4, 5, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.intentions?.length ? (
        <div className="py-8 text-center text-muted-foreground">
          {t("noTrades")}
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {data.intentions.map((trade) => (
              <TradeRow
                key={`${trade.invoke_args_tx_id}-${trade.step_index}`}
                trade={trade}
                rune={runeCoin}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </>
      )}
    </TabsContent>
  );
}
