import { Actor, HttpAgent } from "@dfinity/agent";
import { ICP_HOST, ORCHESTRATOR_CANISTER_ID } from "../constants/canister";
import { idlFactory } from "../dids/orchestrator.did";

export const actor = Actor.createActor(idlFactory, {
  agent: HttpAgent.createSync({
    host: ICP_HOST,
    retryTimes: 30,
  }),
  canisterId: ORCHESTRATOR_CANISTER_ID,
});
