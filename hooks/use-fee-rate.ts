import { useEffect, useState } from "react";

import { Orchestrator } from "@/lib/orchestrator";

export function useRecommendedFeeRateFromOrchestrator(refetch?: boolean) {
  const [feeRate, setFeeRate] = useState(5);
  const [timer, setTimer] = useState<number>(0);
  useEffect(() => {
    Orchestrator.getRecommendedFee()
      .then((fee) => {
        setFeeRate(fee);
      })
      .catch(() => null);
  }, [timer]);

  useEffect(() => {
    if (!refetch) {
      return;
    }
    const interval = setInterval(() => setTimer(Date.now()), 15 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [refetch]);

  return feeRate;
}
