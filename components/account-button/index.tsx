import { useLaserEyes } from "@omnisat/lasereyes";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import Image from "next/image";
import { ellipseMiddle } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { WALLETS } from "@/lib/constants";
import { AccountSheetContent } from "./account-sheet-content";
import { usePendingTransactions } from "@/store/transactions";

export function AccountButton() {
  const { address, provider } = useLaserEyes();

  const pendingTransactions = usePendingTransactions();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          className="text-foreground relative rounded-full px-3"
        >
          {provider && (
            <Image
              alt={WALLETS[provider]?.name ?? ""}
              width={64}
              height={64}
              className="size-5"
              src={WALLETS[provider]?.icon ?? ""}
            />
          )}
          <span>{ellipseMiddle(address)}</span>
          <ChevronDown className="text-muted-foreground size-4" />
          {pendingTransactions.length > 0 && (
            <div className="absolute size-2 rounded-full bg-primary/60 left-0 top-0">
              <span className="animate-ping -left-0.5 -top-0.5 absolute inline-flex size-3 rounded-full bg-yellow-300 opacity-75" />
            </div>
          )}
        </Button>
      </SheetTrigger>
      <AccountSheetContent />
    </Sheet>
  );
}
