import { NetworkType } from "@omnisat/lasereyes-react";

export const UTXO_DUST = BigInt(546);
export const ICP_HOST = "https://ic0.app";
export const EXCHANGE_ID = "RICH_SWAP";

export const EXCHANGE_CANISTER_ID =
  process.env.NEXT_PUBLIC_EXCHANGE_CANISTER_ID ?? "";

export const MAESTRO_API_KEY = process.env.NEXT_PUBLIC_MAESTRO_API_KEY ?? "";

export const RICH_POOL = process.env.NEXT_PUBLIC_RICH_POOL ?? "";

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ??
  "mainnet") as NetworkType;

export const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "testnet";

export const MEMPOOL_URL =
  process.env.NEXT_PUBLIC_MEMPOOL_URL ?? "https://mempool.space";

export const RUNESCAN_URL =
  process.env.NEXT_PUBLIC_RUNESCAN_URL ?? "https://testnet.runescan.net";

export const REE_INDEXER_URL =
  process.env.NEXT_PUBLIC_REE_INDEXER_URL ??
  "https://ree-hasura-testnet.omnity.network/v1/graphql";

export const CLAIMABLE_PROTOCOL_FEE_THRESHOLD =
  NETWORK === "mainnet" ? 10_000 : 546;

export const BITCOIN_BLOCK_TIME_MINUTES = 10;
