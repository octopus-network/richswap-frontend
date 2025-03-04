export const idlFactory = ({ IDL }: { IDL: any }) => {
  const ExchangeError = IDL.Variant({
    InvalidSignPsbtArgs: IDL.Text,
    InvalidNumeric: IDL.Null,
    Overflow: IDL.Null,
    InvalidInput: IDL.Null,
    PoolAddressNotFound: IDL.Null,
    PoolStateExpired: IDL.Nat64,
    TooSmallFunds: IDL.Null,
    InvalidRuneId: IDL.Null,
    InvalidPool: IDL.Null,
    InvalidPsbt: IDL.Text,
    PoolAlreadyExists: IDL.Null,
    InvalidTxid: IDL.Null,
    InvalidLiquidity: IDL.Null,
    EmptyPool: IDL.Null,
    LpNotFound: IDL.Null,
    ChainKeyError: IDL.Null,
    FetchRuneIndexerError: IDL.Null,
    InvalidState: IDL.Text,
    InsufficientFunds: IDL.Null,
  });
  const Result = IDL.Variant({ Ok: IDL.Text, Err: ExchangeError });
  const FinalizeTxArgs = IDL.Record({
    txid: IDL.Text,
    pool_key: IDL.Text,
  });
  const Liquidity = IDL.Record({
    user_share: IDL.Nat,
    sqrt_k: IDL.Nat,
    btc_supply: IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ Ok: Liquidity, Err: ExchangeError });
  const GetPoolInfoArgs = IDL.Record({ pool_address: IDL.Text });
  const CoinBalance = IDL.Record({ id: IDL.Text, value: IDL.Nat });
  const Utxo = IDL.Record({
    maybe_rune: IDL.Opt(CoinBalance),
    sats: IDL.Nat64,
    txid: IDL.Text,
    vout: IDL.Nat32,
  });
  const PoolInfo = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    btc_reserved: IDL.Nat64,
    coin_reserved: IDL.Vec(CoinBalance),
    attributes: IDL.Text,
    address: IDL.Text,
    nonce: IDL.Nat64,
    utxos: IDL.Vec(Utxo),
  });
  const GetPoolListArgs = IDL.Record({
    from: IDL.Opt(IDL.Text),
    limit: IDL.Nat32,
  });
  const PoolOverview = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    btc_reserved: IDL.Nat64,
    address: IDL.Text,
    nonce: IDL.Nat64,
  });
  const LiquidityOffer = IDL.Record({
    output: CoinBalance,
    inputs: IDL.Opt(Utxo),
    nonce: IDL.Nat64,
  });
  const Result_2 = IDL.Variant({
    Ok: LiquidityOffer,
    Err: ExchangeError,
  });
  const ExtractFeeOffer = IDL.Record({
    output: CoinBalance,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_3 = IDL.Variant({
    Ok: ExtractFeeOffer,
    Err: ExchangeError,
  });
  const SwapOffer = IDL.Record({
    output: CoinBalance,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_4 = IDL.Variant({ Ok: SwapOffer, Err: ExchangeError });
  const WithdrawalOffer = IDL.Record({
    nonce: IDL.Nat64,
    input: Utxo,
    user_outputs: IDL.Vec(CoinBalance),
  });
  const Result_5 = IDL.Variant({
    Ok: WithdrawalOffer,
    Err: ExchangeError,
  });
  const InputCoin = IDL.Record({ coin: CoinBalance, from: IDL.Text });
  const OutputCoin = IDL.Record({ to: IDL.Text, coin: CoinBalance });
  const Intention = IDL.Record({
    input_coins: IDL.Vec(InputCoin),
    output_coins: IDL.Vec(OutputCoin),
    action: IDL.Text,
    exchange_id: IDL.Text,
    pool_utxo_spend: IDL.Vec(IDL.Text),
    nonce: IDL.Nat64,
    pool_utxo_receive: IDL.Vec(IDL.Text),
    pool_address: IDL.Text,
  });
  const IntentionSet = IDL.Record({
    initiator_address: IDL.Text,
    intentions: IDL.Vec(Intention),
  });
  const SignPsbtArgs = IDL.Record({
    zero_confirmed_tx_count_in_queue: IDL.Nat32,
    txid: IDL.Text,
    intention_set: IntentionSet,
    intention_index: IDL.Nat32,
    psbt_hex: IDL.Text,
  });
  const Result_6 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  return IDL.Service({
    create: IDL.Func([IDL.Text], [Result], []),
    finalize_tx: IDL.Func([FinalizeTxArgs], [], []),
    get_fee_collector: IDL.Func([], [IDL.Text], ["query"]),
    get_lp: IDL.Func([IDL.Text, IDL.Text], [Result_1], ["query"]),
    get_min_tx_value: IDL.Func([], [IDL.Nat64], ["query"]),
    get_pool_info: IDL.Func([GetPoolInfoArgs], [IDL.Opt(PoolInfo)], ["query"]),
    get_pool_list: IDL.Func(
      [GetPoolListArgs],
      [IDL.Vec(PoolOverview)],
      ["query"]
    ),
    pre_add_liquidity: IDL.Func([IDL.Text, CoinBalance], [Result_2], ["query"]),
    pre_extract_fee: IDL.Func([IDL.Text], [Result_3], ["query"]),
    pre_swap: IDL.Func([IDL.Text, CoinBalance], [Result_4], ["query"]),
    pre_withdraw_liquidity: IDL.Func(
      [IDL.Text, IDL.Text, CoinBalance],
      [Result_5],
      ["query"]
    ),
    rollback_tx: IDL.Func([FinalizeTxArgs], [], []),
    set_fee_collector: IDL.Func([IDL.Text], [], []),
    set_orchestrator: IDL.Func([IDL.Principal], [], []),
    sign_psbt: IDL.Func([SignPsbtArgs], [Result_6], []),
  });
};
