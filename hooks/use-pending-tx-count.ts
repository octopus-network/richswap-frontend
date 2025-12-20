import { useEffect, useState } from "react";

import { Orchestrator } from "@/lib/orchestrator";

export function usePendingTxCount(refetch?: boolean) {
  const [pendingTxCount, setPendingTxCount] = useState(0);
  const [timer, setTimer] = useState<number>(0);
  useEffect(() => {
    Orchestrator.getPendingTxCount()
      .then((count) => {
        setPendingTxCount(count);
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

  return pendingTxCount;
}
