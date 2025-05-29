import { SheetContent, SheetClose } from "@/components/ui/sheet";
import { ChevronsRight, ExternalLink, Check, Copy, Power } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { ellipseMiddle, formatNumber } from "@/lib/utils";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { BITCOIN, WALLETS, RUNESCAN_URL } from "@/lib/constants";
import { useClipboard } from "@/hooks/use-clipboard";
import { useCoinBalance } from "@/hooks/use-balance";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinsContent } from "./coins-content";
import { usePendingTransactions } from "@/store/transactions";
import { TransactionsContent } from "./transactions-content";
import { useTranslations } from "next-intl";

export function AccountSheetContent() {
  const { provider, address, paymentAddress, disconnect } = useLaserEyes();
  const { hasCopied, onCopy } = useClipboard(address);
  const { hasCopied: hasPaymentCopied, onCopy: onPaymentCopy } =
    useClipboard(paymentAddress);
  const btcBalacne = useCoinBalance(BITCOIN);
  const pendingTransactions = usePendingTransactions();
  const t = useTranslations("AccountSheet");

  return (
    <SheetContent className="p-0" hideCloseButton>
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 rounded-sm flex items-center justify-between">
          <div className="flex items-center">
            <Image
              alt={WALLETS[provider]?.name ?? ""}
              width={64}
              height={64}
              className="size-7 rounded-full"
              src={WALLETS[provider]?.icon ?? ""}
            />
            <div className="flex flex-col justify-start ml-2">
              <span className="font-semibold">
                {ellipseMiddle(address, 10)}
              </span>
              {paymentAddress !== address ? (
                <div className="flex text-xs text-muted-foreground items-center">
                  <span>{t("payment")}:</span>
                  <span className="ml-2">
                    {ellipseMiddle(paymentAddress, 6)}
                  </span>
                  <Button
                    size="icon"
                    className="h-5 w-5"
                    variant="ghost"
                    onClick={onPaymentCopy}
                  >
                    {hasPaymentCopied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button size="icon" variant="ghost" onClick={onCopy}>
              {hasCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={disconnect}
              className="hidden sm:inline-flex"
            >
              <Power className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="p-4 pt-2">
          <span className="font-bold text-2xl">
            {formatNumber(btcBalacne)} BTC
          </span>
        </div>
        <div className="px-4">
          <Link href={`${RUNESCAN_URL}/address/${address}`} target="_blank">
            <Button variant="secondary" className="w-full">
              {t("viewOnExplorer")} <ExternalLink className="size-4" />
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="w-full inline-flex sm:hidden mt-2"
            onClick={disconnect}
          >
            <Power className="size-4" />
            <span className="ml-1">{t("disconnect")}</span>
          </Button>
        </div>
        <Tabs defaultValue="coins" className="h-[calc(100%_-_182px)] mt-4">
          <TabsList className="bg-transparent p-0 h-auto w-full rounded-none justify-start px-2">
            <TabsTrigger value="coins" className="px-2 h-8">
              {t("coins")}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="px-2 h-8 relative">
              {pendingTransactions.length > 0 && (
                <div className="absolute size-2 rounded-full bg-primary/60 left-0.5 top-0.5">
                  <span className="animate-ping -left-0.5 -top-0.5 absolute inline-flex size-3 rounded-full bg-yellow-300 opacity-75" />
                </div>
              )}
              {t("transactions")}
              {pendingTransactions.length > 0
                ? ` (${pendingTransactions.length} pending)`
                : ""}
            </TabsTrigger>
          </TabsList>
          <div className="overflow-y-scroll h-[calc(100%_-_32px)]">
            <CoinsContent />
            <TransactionsContent />
          </div>
        </Tabs>
      </div>
      <SheetClose>
        <div className="group absolute -left-12 w-12 rounded-l-3xl bg-transparent cursor-pointer duration-200 transation-colors hover:bg-card/30 bottom-4 top-4 pl-2 pt-6">
          <ChevronsRight className="group-hover:translate-x-2 group-hover:text-muted-foreground transition-all duration-200" />
        </div>
      </SheetClose>
    </SheetContent>
  );
}
