export type CoinBalance = {
  id: string;
  value: bigint;
};

export type AssetWithOwner = {
  coin_balance: CoinBalance;
  owner_address: string;
};

export type ReeInstruction = {
  method: string;
  exchange_id: string;
  input_coins: AssetWithOwner[];
  output_coins: AssetWithOwner[];
  nonce?: bigint[];
  pool_key?: string[];
};

export type InvokeArgs = {
  instruction_set: {
    steps: ReeInstruction[];
  };
  psbt_hex: string;
};
