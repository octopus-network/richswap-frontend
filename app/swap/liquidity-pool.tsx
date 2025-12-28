import { useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import LpRow from "@/components/lp-row";
import { Exchange } from "@/lib/exchange";

export default function LiquidityPool({
  poolAddress,
}: {
  poolAddress: string;
}) {
  const t = useTranslations("Pools");
  const [lps, setLps] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([Exchange.getLps(poolAddress as string)]).then(([_lps]) => {
      setLps(_lps);
    });
  }, [poolAddress]);

  return (
    <TabsContent value="liquidityPool">
      <div className="col-span-4 p-4 pt-0">
        <div className="grid grid-cols-9 mt-3 text-muted-foreground text-sm">
          <span className="col-span-4">{t("address")}</span>
          <span className="col-span-3">{t("unlockTime")}</span>
          <span className="col-span-2 justify-end inline-flex">
            {t("percentage")}
          </span>
        </div>
        <div className="flex flex-col gap-3 mt-3">
          {lps.length
            ? lps
                .sort((a, b) => b.percentage - a.percentage)
                .map((lp) => <LpRow lp={lp} key={lp.address} />)
            : [1, 2, 3, 4].map((idx) => (
                <div className="flex justify-between" key={idx}>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
        </div>
      </div>
    </TabsContent>
  );
}
