import { Actor, HttpAgent } from "@dfinity/agent";
import { ICP_HOST } from "../constants";
import { idlFactory } from "../dids/richswap.did";

import fetch from "isomorphic-fetch";

const EXCHANGE_CANISTER_ID = process.env.NEXT_PUBLIC_EXCHANGE_CANISTER_ID!;

export const actor = Actor.createActor(idlFactory, {
  agent: HttpAgent.createSync({
    host: ICP_HOST,
    retryTimes: 50,
    verifyQuerySignatures: false,
    fetch,
  }),
  canisterId: EXCHANGE_CANISTER_ID,
});
