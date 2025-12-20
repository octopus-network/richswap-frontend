import { CoinBalance } from "./coin";

export type InputCoin = {
  coin: CoinBalance;
  from: string;
};

export type OutputCoin = {
  coin: CoinBalance;
  to: string;
};

export type Intention = {
  input_coins: InputCoin[];
  output_coins: OutputCoin[];
  action: string;
  exchange_id: string;
  action_params: string;
  pool_utxo_spent: string[];
  nonce: bigint;
  pool_utxo_received: string[];
  pool_address: string;
};

export type IntentionSet = {
  tx_fee_in_sats: bigint;
  initiator_address: string;
  intentions: Intention[];
};

export type InvokeArgs = {
  initiator_utxo_proof: number[];
  intention_set: IntentionSet;
  psbt_hex: string;
  client_info?: [string];
};

export type TxOutputType =
  | { P2WPKH: null }
  | { P2TR: null }
  | { P2SH: null }
  | { OpReturn: bigint };

export type EstimateMinTxFeeArgs = {
  input_types: TxOutputType[];
  pool_address: string[];
  output_types: TxOutputType[];
};

export type OutpointWithValue = {
  maybe_rune: [CoinBalance];
  value: bigint;
  script_pubkey_hex: string;
  outpoint: string;
};

export type OrchestratorStatus = {
  mempool_tx_fee_rate: {
    low: bigint;
    high: bigint;
    update_time: string;
    medium: bigint;
  };
  pending_tx_count: bigint;
};
