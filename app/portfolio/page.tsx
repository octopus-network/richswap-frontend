"use client";

import { usePortfolios } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { PortfolioRow } from "./portfolio-row";
import { Button } from "@/components/ui/button";
import { useSetAtom } from "jotai";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { Empty } from "@/components/empty";
import { useTranslations } from "next-intl";

export default function Portolios() {
  const { paymentAddress } = useLaserEyes();
  const [portfolios] = usePortfolios();
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);
  const t = useTranslations("Portfolio");

  return (
    <div className="md:pt-6 w-full flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center">
          <span className="text-3xl font-semibold">{t("portfolio")}</span>
        </div>
        <div className="mt-6 border rounded-xl overflow-x-auto">
          <div className="w-max sm:w-auto">
            <div className="grid px-4 bg-secondary/50 text-sm rounded-t-xl grid-cols-10 sm:grid-cols-12 items-center gap-1 sm:gap-3 md:gap-6 py-3 text-muted-foreground">
              <div className="col-span-3">{t("pool")}</div>
              <div className="col-span-2">
                <span>{t("balance")}</span>
              </div>
              <div className="col-span-2 hidden sm:flex">
                <span>{t("yield")}</span>
              </div>
              <div className="col-span-3 text-center sm:text-left">
                <span>{t("unlockTime")}</span>
              </div>
              <div className="col-span-2">
                <span>{t("actions")}</span>
              </div>
            </div>
            {portfolios?.length ? (
              portfolios.map((position, idx) => (
                <PortfolioRow position={position} key={idx} />
              ))
            ) : paymentAddress ? (
              portfolios?.length === 0 ? (
                <div className="min-h-60 flex items-center justify-center">
                  <Empty label="No data" />
                </div>
              ) : (
                [1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 h-[72px] items-center gap-1 sm:gap-3 md:gap-6 px-4 py-3 bg-secondary/20"
                  >
                    <div className="col-span-3 flex items-center space-x-3">
                      <Skeleton className="size-10 rounded-full hidden sm:block" />
                      <div className="flex flex-col space-y-1">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                    <div className="col-span-2 flex">
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                    <div className="col-span-2 hidden md:flex">
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                    <div className="col-span-3 hidden md:flex">
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                    <div className="col-span-2 hidden md:flex">
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  </div>
                ))
              )
            ) : (
              <div className="min-h-60 flex items-center justify-center">
                <Button
                  variant="accent"
                  className="rounded-full"
                  size="lg"
                  onClick={() => updateConnectWalletModalOpen(true)}
                >
                  {t("connectWallet")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
