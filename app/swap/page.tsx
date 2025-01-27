import { RefreshCcw } from "lucide-react";
import { Suspense } from "react";
import { SwapPanel } from "./swap-panel";
import { Button } from "@/components/ui/button";

export default function SwapPage() {
  return (
    <Suspense>
      <div className="md:pt-12 w-full flex flex-col items-center">
        <div className="max-w-lg w-full">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">Swap</span>
            <Button
              size="icon"
              className="rounded-full size-8 text-muted-foreground opacity-70 hover:opacity-100"
              variant="secondary"
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
          <SwapPanel />
        </div>
      </div>
    </Suspense>
  );
}
