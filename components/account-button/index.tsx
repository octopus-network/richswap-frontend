import { useLaserEyes } from "@omnisat/lasereyes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import Image from "next/image";
import { ellipseMiddle } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { WALLETS } from "@/lib/constants";
import { AccountSheetContent } from "./account-sheet-content";

export function AccountButton() {
  const { address, disconnect, provider } = useLaserEyes();

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
        </Button>
      </SheetTrigger>
      <AccountSheetContent />
    </Sheet>
  );
}
