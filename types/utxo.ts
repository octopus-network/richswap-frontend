export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshis: string;
  scriptPk: string;
  pubkey: string;
  addressType: AddressType;
  address: string;
  runes: {
    id: string;
    amount: string;
  }[];
  height?: number;
  rawtx?: string;
}

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH, // deprecated
  M44_P2TR, // deprecated
  P2WSH,
  P2SH,
  UNKNOWN,
}

export interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo?: { value: bigint; script: Uint8Array };
    tapInternalKey?: Uint8Array;
    nonWitnessUtxo?: Uint8Array;
  };
  utxo: UnspentOutput;
}

export interface TxOutput {
  address?: string;
  script?: Uint8Array;
  value: bigint;
}

export type RawBtcUtxo = {
  txid: string;
  vout: number;
  script_pubkey: string;
  satoshis: string;
  confirmations: bigint;
  height: bigint;
  mempool?: boolean;
  runes: {
    rune_id: string;
    amount: string;
  }[];
  inscriptions: {
    offset: bigint;
    inscription_id: string;
  }[];
  address: string;
};

export type RawRuneUtxo = {
  txid: string;
  vout: number;
  satoshis: string;
  confirmations: bigint;
  height: bigint;
  runes: {
    rune_id: string;
    amount: string;
  }[];
};

export type RawRuneInfo = {
  divisibility: number;
  etching_cenotaph: boolean;
  etching_height: number;
  etching_tx: string;
  id: string;
  max_supply: string;
  mints: number;
  name: string;
  premine: string;
  spaced_name: string;
  symbol: string;
  unique_holders: number;
};

export type RawInscription = {
  inscription_id: string;
  satoshis: string;
  utxo_sat_offset: bigint;
  utxo_txid: string;
  utxo_vout: number;
  utxo_block_height: number;
  utxo_confirmations: string;
};
