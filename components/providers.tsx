"use client";

import { PropsWithChildren } from "react";
import { LaserEyesProvider, BaseNetwork } from "@omnisat/lasereyes-react";
import { TooltipProvider } from "./ui/tooltip";
import {
  NETWORK,
  EXCHANGE_ID,
  EXCHANGE_CANISTER_ID,
  MAESTRO_API_KEY,
} from "@/lib/constants";
import { Network, ReeProvider } from "@omnity/ree-client-ts-sdk/react";
import { idlFactory } from "@/lib/dids/richswap.did";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  // Determine the correct LaserEyes network
  const laserEyesNetwork =
    NETWORK === "mainnet"
      ? BaseNetwork.MAINNET
      : NETWORK === "testnet4"
      ? BaseNetwork.TESTNET4
      : BaseNetwork.TESTNET;

  return (
    <LaserEyesProvider
      config={{
        network: laserEyesNetwork,
      }}
    >
      <ReeProvider
        config={{
          network: NETWORK === "mainnet" ? Network.Mainnet : Network.Testnet,
          maestroApiKey: MAESTRO_API_KEY,
          exchangeIdlFactory: idlFactory,
          exchangeId: EXCHANGE_ID,
          exchangeCanisterId: EXCHANGE_CANISTER_ID,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </ReeProvider>
    </LaserEyesProvider>
  );
}
