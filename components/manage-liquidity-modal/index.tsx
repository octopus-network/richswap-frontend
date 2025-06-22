"use client";

import { Position, PoolInfo } from "@/types";
import { useEffect, useState } from "react";
import { BaseModal } from "../base-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositContent } from "./deposit-content";
import { WithdrawContent } from "./withdraw-content";
import Link from "next/link";
import { getCoinSymbol } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";
import { Exchange } from "@/lib/exchange";
import { useTranslations } from "next-intl";

export function ManageLiquidityModal({
  open,
  poolAddress,
  setOpen,
  position,
}: {
  open: boolean;
  poolAddress: string;
  setOpen: (open: boolean) => void;
  position: Position | null | undefined;
}) {
  const [onReview, setOnReview] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo>();

  const t = useTranslations("Pools");

  useEffect(() => {
    Exchange.getPoolInfo(poolAddress).then((res) => {
      if (!res) {
        return;
      }
      setPoolInfo(res);
    });
  }, [poolAddress, open]);
  return (
    <BaseModal
      open={open}
      setOpen={setOpen}
      showCloseButton={!onReview}
      title={t("managePool")}
    >
      <div className="p-5 pt-0">
        <Tabs defaultValue="deposit">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent gap-4">
              <TabsTrigger
                value="deposit"
                className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
              >
                {t("deposit")}
              </TabsTrigger>
              {position && (
                <TabsTrigger
                  value="withdraw"
                  className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
                >
                  {t("withdraw")}
                </TabsTrigger>
              )}
            </TabsList>
            <Link
              href={`/swap?coinA=${getCoinSymbol(
                poolInfo?.coinA ?? null
              )}&coinB=${getCoinSymbol(poolInfo?.coinB ?? null)}`}
              className="text-primary/80 hover:text-primary ml-3 text-sm inline-flex items-center"
            >
              <ArrowLeftRight className="mr-1 size-3" /> {t("swap")}
            </Link>
          </div>
          <DepositContent
            pool={poolInfo}
            setOnReview={setOnReview}
            onSuccess={() => {
              setOpen(false);
              setOnReview(false);
            }}
          />
          <WithdrawContent
            setOnReview={setOnReview}
            onSuccess={() => {
              setOpen(false);
              setOnReview(false);
            }}
            position={position}
          />
        </Tabs>
      </div>
    </BaseModal>
  );
}
