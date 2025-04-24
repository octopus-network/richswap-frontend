"use client";

import { Position, PoolInfo } from "@/types";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositContent } from "./deposit-content";
import { WithdrawContent } from "./withdraw-content";

export function ManageLiquidityPanel({
  pool,
  position,
}: {
  pool: PoolInfo;
  position: Position | null | undefined;
}) {
  return (
    <div>
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
        </div>
        <DepositContent pool={pool} onSuccess={() => {}} />
        <WithdrawContent onSuccess={() => {}} position={position} />
      </Tabs>
    </div>
  );
}
