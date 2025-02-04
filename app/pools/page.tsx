"use client";

import { CreateButton } from "./create-button";
import { usePoolList } from "@/hooks/use-pools";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolRow } from "./pool-row";
import { useLaserEyes } from "@omnisat/lasereyes";

export default function Pools() {
  const poolList = usePoolList();
  const { address } = useLaserEyes();
  return (
    <div className="md:pt-12 w-full flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center h-9">
          <span className="text-2xl font-semibold">Pools</span>
          {address && <CreateButton />}
        </div>
        <div className="mt-4 space-y-4">
          {poolList?.length ? (
            poolList.map((pool, idx) => <PoolRow pool={pool} key={idx} />)
          ) : (
            <Skeleton className="h-[68px] w-full rounded-2xl" />
          )}
        </div>
      </div>
    </div>
  );
}
