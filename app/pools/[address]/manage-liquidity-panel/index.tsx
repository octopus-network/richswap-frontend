"use client";

import { Position, PoolInfo } from "@/types";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DepositForm } from "./deposit-form";
import { WithdrawForm } from "./withdraw-form";
import { DonateForm } from "./donate-form";
import { useTranslations } from "next-intl";

export function ManageLiquidityPanel({
  pool,
  position,
}: {
  pool: PoolInfo;
  position: Position | null | undefined;
}) {
  const t = useTranslations("Pools");

  return (
    <div>
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
            <TabsTrigger
              value="donate"
              className="h-10 rounded-none text-foreground text-lg font-semibold px-0 border-b-[2px] border-transparent data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-primary"
            >
              {t("donate")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="deposit">
          <DepositForm pool={pool} />
        </TabsContent>
        <TabsContent value="withdraw">
          <WithdrawForm position={position} />
        </TabsContent>
        <TabsContent value="donate">
          <DonateForm pool={pool} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
