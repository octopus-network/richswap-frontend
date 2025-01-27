export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshis: string;
  scriptPk: string;
  address: string;
  runes: {
    id: string;
    amount: string;
  }[];
}
