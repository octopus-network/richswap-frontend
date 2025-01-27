export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshis: string;
  scriptPk: string;
  address: string;
  rune?: {
    id: string;
    amount: string;
  };
  status?: {
    confirmed: boolean;
    blockHeight: number;
  };
}
