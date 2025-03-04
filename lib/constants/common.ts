import { NetworkType } from "@omnisat/lasereyes";

export const UTXO_DUST = BigInt(546);
export const ICP_HOST = "https://icp-api.io";
export const EXCHANGE_ID = "RICH_SWAP";

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ??
  "mainnet") as NetworkType;
