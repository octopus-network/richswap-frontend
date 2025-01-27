import { Coin } from "./coin";

export type ToSignInput = {
  address: string;
  index: number;
};

export enum TransactionStatus {
  BROADCASTED,
  CONFIRMING,
  FINALIZED,
  REJECTED,
  FAILED
}

export enum TransactionType {
  SWAP,
  ADD_LIQUIDITY,
  WITHDRAW_LIQUIDITY,
}

export interface TransactionInfo {
  txid: string;
  type: TransactionType;
  status: TransactionStatus;
  coinA: Coin;
  coinB: Coin;
  coinAAmount: string;
  coinBAmount: string;
  poolKey: string;
  timestamp: number;
  nonce?: string;
  message?: string;
  blockHeight?: number;
}
