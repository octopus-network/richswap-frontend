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
  pool?: PoolData;
};

export enum DepositState {
  LOADING = "loading",
  INVALID = "invalid",
  EMPTY = "empty",
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

export type PoolData = {
  key: string;
  coinAId: string;
  coinBId: string;
  coinAAmount: string;
  coinBAmount: string;
  incomes: string;
};

export type PoolInfo = {
  key: string;
  address: string;
  name: string;
  coinA: Coin;
  coinB: Coin;
  btcReserved: string;
  incomes: string;
};

export interface Position {
  poolKey: string;
  coinA: Coin | undefined;
  coinAAmount: string;
  coinB: Coin | undefined;
  coinBAmount: string;
  btcSupply: string;
  userAddress: string;
  userShare: string;
  sqrtK: string;
}
