import { Coin, CoinBalance, CoinWithBalance } from "./coin";

import { UnspentOutput } from "./utxo";

export enum SwapState {
  LOADING = "loading",
  INVALID = "invalid",
  STALE = "stale",
  NO_POOL = "no_pool",
  VALID = "valid",
}

export type SwapRoute = {
  pool: PoolData;
  nonce: string;
  poolUtxos: UnspentOutput[];
  inputAmount: string;
  outputAmount: string;
};

export type SwapQuote = {
  state: SwapState;
  errorMessage?: string;
  routes?: SwapRoute[];
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
  address: string;
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
  nonce: number;
  coinA: CoinWithBalance;
  coinB: CoinWithBalance;
};

export interface Position {
  pool: PoolInfo;
  coinA: Coin | undefined;
  coinAAmount: string;
  coinB: Coin | undefined;
  coinBAmount: string;
  totalShare: string;
  userAddress: string;
  userShare: string;
  userIncomes: string;
}
