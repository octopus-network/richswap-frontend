"use client";

import { PropsWithChildren } from "react";
import { LaserEyesProvider } from "@omnisat/lasereyes-react";

import { NETWORK } from "@/lib/constants";

export function Providers({ children }: PropsWithChildren) {
  return (
    <LaserEyesProvider
      config={{
        network: NETWORK,
      }}
    >
      {children}
    </LaserEyesProvider>
  );
}
