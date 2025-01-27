import { useLaserEyes } from "@omnisat/lasereyes";
import { useMemo } from "react";

export function useWallet() {
  const data = useLaserEyes();
  return useMemo(() => data, [data]);
}
