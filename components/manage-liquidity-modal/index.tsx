"use client";

import { PoolInfo } from "@/types";
import { useState } from "react";
import { BaseModal } from "../base-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositContent } from "./deposit-content";
import { WithdrawContent } from "./withdraw-content";

export function ManageLiquidityModal({
  open,
  setOpen,
  pool,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  pool: PoolInfo;
}) {
  const [onReview, setOnReview] = useState(false);
  return (
    <BaseModal open={open} setOpen={setOpen} showCloseButton={!onReview}>
      <div className="p-5">
        <Tabs defaultValue="deposit">
          <TabsList className="bg-transparent gap-4">
            <TabsTrigger
              value="deposit"
              className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
            >
              Withdraw
            </TabsTrigger>
          </TabsList>
          <DepositContent
            pool={pool}
            setOnReview={setOnReview}
            onSuccess={() => setOpen(false)}
          />
          <WithdrawContent />
        </Tabs>
      </div>
    </BaseModal>
  );
}
