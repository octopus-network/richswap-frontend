import { Actor, HttpAgent } from "@dfinity/agent";
import { ICP_HOST } from "../constants";
import { idlFactory } from "../dids/orchestrator.did";

const ORCHESTRATOR_CANISTER_ID =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_CANISTER_ID!;

export const actor = Actor.createActor(idlFactory, {
  agent: HttpAgent.createSync({
    host: ICP_HOST,
    retryTimes: 30,
  }),
  canisterId: ORCHESTRATOR_CANISTER_ID,
});
