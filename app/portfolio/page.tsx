"use client";

import { usePortfolios } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaserEyes } from "@omnisat/lasereyes";
import { PortfolioRow } from "./portfolio-row";
import { Button } from "@/components/ui/button";
import { useSetAtom } from "jotai";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";

export default function Portolios() {
  const { address } = useLaserEyes();
  const portfolios = usePortfolios(address);
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center">
          <span className="text-3xl font-semibold">Portolios</span>
        </div>
        <div className="mt-6 border rounded-xl overflow-hidden">
          <div className="grid px-4 bg-secondary/50 text-sm rounded-t-xl grid-cols-10 items-center gap-1 sm:gap-3 md:gap-6 py-3 text-muted-foreground">
            <div className="col-span-3">Pool</div>
            <div className="col-span-3">
              <span>Balance</span>
            </div>
            <div className="col-span-3">
              <span>Yield</span>
            </div>
          </div>
          {portfolios?.length ? (
            portfolios.map((position, idx) => (
              <PortfolioRow position={position} key={idx} />
            ))
          ) : address ? (
            [1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="grid grid-cols-10 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 px-4 py-3 bg-secondary/20"
              >
                <div className="col-span-3 flex items-center space-x-3">
                  <Skeleton className="size-10 rounded-full hidden sm:block" />
                  <div className="flex flex-col space-y-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
                <div className="col-span-3 flex">
                  <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="col-span-3 hidden md:flex">
                  <Skeleton className="h-5 w-2/3" />
                </div>
              </div>
            ))
          ) : (
            <div className="min-h-60 flex items-center justify-center">
              <Button
                variant="accent"
                className="rounded-full"
                size="lg"
                onClick={() => updateConnectWalletModalOpen(true)}
              >
                Connect wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
