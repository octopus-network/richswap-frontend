import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradesContent from "./trades-content";
import { motion } from "framer-motion";
import MyTradesContent from "./my-trades-content";
import LiquidityPool from "./liquidity-pool";
import { useLaserEyes } from "@omnisat/lasereyes-react";

export default function TradingActivity({
  rune,
  poolAddress,
}: {
  rune: string;
  poolAddress: string;
}) {
  const [open, setOpen] = useState(true);
  const t = useTranslations("Swap");
  const [tab, setTab] = useState<string>("trades");
  const { address } = useLaserEyes();
  return (
    <div className="bg-secondary/60 rounded-xl flex flex-col">
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-lg font-semibold">{t("tradingActivity")}</span>
        {open ? (
          <ChevronUp
            className="size-4 text-muted-foreground cursor-pointer"
            onClick={() => setOpen(false)}
          />
        ) : (
          <ChevronDown
            className="size-4 text-muted-foreground cursor-pointer"
            onClick={() => setOpen(true)}
          />
        )}
      </div>
      {open && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent border-b w-full space-x-4 justify-start h-auto p-0 px-4">
            {(address
              ? ["trades", "myTrades", "liquidityPool"]
              : ["trades", "liquidityPool"]
            ).map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className="pb-3 px-0 text-foreground relative data-[state=active]:bg-transparent data-[state=active]:text-primary"
              >
                {t(item)}
                {tab === item && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 40,
                    }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <TradesContent rune={rune} />
          <MyTradesContent rune={rune} />
          <LiquidityPool poolAddress={poolAddress} />
        </Tabs>
      )}
    </div>
  );
}
