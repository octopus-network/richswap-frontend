"use client";

import { PropsWithChildren } from "react";
import { LaserEyesProvider } from "@omnisat/lasereyes-react";

import {
  NETWORK,
  EXCHANGE_ID,
  EXCHANGE_CANISTER_ID,
  MAESTRO_API_KEY,
} from "@/lib/constants";
import { Network, ReeProvider } from "@omnity/ree-client-ts-sdk";
import { idlFactory } from "@/lib/dids/richswap.did";

export function Providers({ children }: PropsWithChildren) {
  return (
    <LaserEyesProvider
      config={{
        network: NETWORK,
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
        {children}
      </ReeProvider>
    </LaserEyesProvider>
  );
}
