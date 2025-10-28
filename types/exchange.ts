import { Coin, CoinWithBalance } from "./coin";

import { UnspentOutput } from "./utxo";

export enum SwapState {
  LOADING = "loading",
  INVALID = "invalid",
  STALE = "stale",
  NO_POOL = "no_pool",
  VALID = "valid",
}

export type SwapRoute = {
  pool: PoolInfo;
  nonce: string;
  poolUtxos: UnspentOutput[];
  inputAmount: string;
  outputAmount: string;
  runePriceInSats: number;
  priceImpact: number;
  poolPriceImpact?: number;
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

export enum DonateState {
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

export type DonateQuote = {
  state: DonateState;
  coinAAmount: string;
  coinBAmount?: string;
  nonce?: string;
  errorMessage?: string;
  utxos?: UnspentOutput[];
};

export type PoolInfo = {
  key: string;
  address: string;
  name: string;
  nonce: number;
  coinA: CoinWithBalance;
  coinB: CoinWithBalance;
  coinADonation: string;
  coinBDonation: string;
  lpFee: string;
  lpFeeRate: number;
  protocolFeeRate: number;
  protocolRevenue: string;
  utxos?: UnspentOutput[];
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
  lockedRevenue: string;
  lockUntil: number;
}
