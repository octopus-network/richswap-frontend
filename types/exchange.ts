import { Coin } from "./coin";

import { UnspentOutput } from "./utxo";

export enum SwapState {
  LOADING = "loading",
  INVALID = "invalid",
  STALE = "stale",
  NO_POOL = "no_pool",
  VALID = "valid",
}

export type SwapQuote = {
  state: SwapState;
  inputAmount: string;
  nonce?: string;
  outputAmount?: string;
  errorMessage?: string;
  utxos?: UnspentOutput[];
  poolKey?: string;
};

export enum DepositState {
  LOADING = "loading",
  INVALID = "invalid",
  STALE = "stale",
  VALID = "valid",
}

export type DepositQuote = {
  state: DepositState;
  inputAmount: string;
  nonce?: string;
  outputAmount?: string;
  errorMessage?: string;
  utxos?: UnspentOutput[];
};

export type PoolInfo = {
  key: string;
  coinA: Coin;
  coinB: Coin;
  coinAAmount: string;
  coinBAmount: string;
};

export interface Position {
  poolKey: string;
  coinA: Coin | undefined;
  coinAAmount: string;
  coinB: Coin | undefined;
  coinBAmount: string;
  nonce: string;
  utxos: UnspentOutput[];
}
