import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

export default function TxQueue({ txCount }: { txCount: number }) {
  const t = useTranslations("Common");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="px-4 py-2 flex items-center space-x-1.5 cursor-pointer text-sm">
          {txCount < 10 ? (
            <>
              <span className="size-2 bg-green-500 rounded-full block" />
              <span className="text-green-500">{t("fluent")}</span>
            </>
          ) : txCount < 24 ? (
            <>
              <span className="size-2 bg-yellow-500 rounded-full block" />
              <span className="text-yellow-500">{t("busy")}</span>
            </>
          ) : (
            <>
              <span className="size-2 bg-red-500 rounded-full block" />
              <span className="text-red-500">{t("congested")}</span>
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {txCount} {t("pendingTransactions")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
