import { Actor, HttpAgent } from "@dfinity/agent";
import { ICP_HOST, EXCHANGE_CANISTER_ID } from "../constants/canister";
import { idlFactory } from "../dids/rich-swap.did";

export const actor = Actor.createActor(idlFactory, {
  agent: HttpAgent.createSync({
    host: ICP_HOST,
    retryTimes: 20,
  }),
  canisterId: EXCHANGE_CANISTER_ID,
});
