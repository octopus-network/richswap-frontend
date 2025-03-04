"use client";

import { PoolInfo, Position, PoolData } from "@/types";
import { useEffect, useState } from "react";
import { BaseModal } from "../base-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositContent } from "./deposit-content";
import { WithdrawContent } from "./withdraw-content";
import Link from "next/link";
import { getCoinSymbol } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";
import { Exchange } from "@/lib/exchange";

export function ManageLiquidityModal({
  open,
  setOpen,
  pool,
  position,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  pool: PoolInfo;
  position: Position | null | undefined;
}) {
  const [onReview, setOnReview] = useState(false);
  const [poolData, setPoolData] = useState<PoolData>();
  useEffect(() => {
    Exchange.getPoolData(pool.address).then((res) => {
      if (!res) {
        return;
      }
      setPoolData(res);
    });
  }, [pool, open]);
  return (
    <BaseModal
      open={open}
      setOpen={setOpen}
      showCloseButton={!onReview}
      title="Manage Pool"
    >
      <div className="p-5 pt-0">
        <Tabs defaultValue="deposit">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent gap-4">
              <TabsTrigger
                value="deposit"
                className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
              >
                Deposit
              </TabsTrigger>
              {position && (
                <TabsTrigger
                  value="withdraw"
                  className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
                >
                  Withdraw
                </TabsTrigger>
              )}
            </TabsList>
            <Link
              href={`/swap?coinA=${getCoinSymbol(
                pool.coinA
              )}&coinB=${getCoinSymbol(pool.coinB)}`}
              className="text-primary/80 hover:text-primary ml-3 text-sm inline-flex items-center"
            >
              <ArrowLeftRight className="mr-1 size-3" /> Swap
            </Link>
          </div>
          <DepositContent
            pool={pool}
            poolData={poolData}
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
