export const idlFactory = ({ IDL }: { IDL: any }) => {
  const Result = IDL.Variant({
    Ok: IDL.Tuple(IDL.Nat64, IDL.Nat64),
    Err: IDL.Text,
  });
  const ExchangeError = IDL.Variant({
    InvalidSignPsbtArgs: IDL.Text,
    UtxoMismatch: IDL.Null,
    InvalidNumeric: IDL.Null,
    Overflow: IDL.Null,
    InvalidInput: IDL.Null,
    PoolAddressNotFound: IDL.Null,
    RuneIndexerError: IDL.Text,
    PoolStateExpired: IDL.Nat64,
    TooSmallFunds: IDL.Null,
    InvalidRuneId: IDL.Null,
    InvalidPool: IDL.Null,
    InvalidPsbt: IDL.Text,
    PoolAlreadyExists: IDL.Null,
    InvalidTxid: IDL.Null,
    Puased: IDL.Null,
    InvalidLiquidity: IDL.Null,
    EmptyPool: IDL.Null,
    FetchBitcoinCanisterError: IDL.Null,
    LpNotFound: IDL.Null,
    NoConfirmedUtxos: IDL.Null,
    ChainKeyError: IDL.Null,
    FetchRuneIndexerError: IDL.Null,
    InvalidState: IDL.Text,
    InsufficientFunds: IDL.Null,
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Text, Err: ExchangeError });
  const CoinBalance = IDL.Record({ id: IDL.Text, value: IDL.Nat });
  const InputCoin = IDL.Record({ coin: CoinBalance, from: IDL.Text });
  const OutputCoin = IDL.Record({ to: IDL.Text, coin: CoinBalance });
  const Intention = IDL.Record({
    input_coins: IDL.Vec(InputCoin),
    output_coins: IDL.Vec(OutputCoin),
    action: IDL.Text,
    exchange_id: IDL.Text,
    pool_utxo_spend: IDL.Vec(IDL.Text),
    action_params: IDL.Text,
    nonce: IDL.Nat64,
    pool_utxo_receive: IDL.Vec(IDL.Text),
    pool_address: IDL.Text,
  });
  const IntentionSet = IDL.Record({
    tx_fee_in_sats: IDL.Nat64,
    initiator_address: IDL.Text,
    intentions: IDL.Vec(Intention),
  });
  const ExecuteTxArgs = IDL.Record({
    zero_confirmed_tx_queue_length: IDL.Nat32,
    txid: IDL.Text,
    intention_set: IntentionSet,
    intention_index: IDL.Nat32,
    psbt_hex: IDL.Text,
  });
  const Result_2 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const Result_3 = IDL.Variant({
    Ok: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    Err: ExchangeError,
  });
  const NewBlockInfo = IDL.Record({
    block_hash: IDL.Text,
    confirmed_txids: IDL.Vec(IDL.Text),
    block_timestamp: IDL.Nat64,
    block_height: IDL.Nat32,
  });
  const Liquidity = IDL.Record({
    total_share: IDL.Nat,
    user_share: IDL.Nat,
    user_incomes: IDL.Nat64,
  });
  const Result_4 = IDL.Variant({ Ok: Liquidity, Err: ExchangeError });
  const GetMinimalTxValueArgs = IDL.Record({
    zero_confirmed_tx_queue_length: IDL.Nat32,
    pool_address: IDL.Text,
  });
  const GetPoolInfoArgs = IDL.Record({ pool_address: IDL.Text });
  const Utxo = IDL.Record({
    maybe_rune: IDL.Opt(CoinBalance),
    sats: IDL.Nat64,
    txid: IDL.Text,
    vout: IDL.Nat32,
  });
  const PoolInfo = IDL.Record({
    key: IDL.Text,
    name: IDL.Text,
    btc_reserved: IDL.Nat64,
    key_derivation_path: IDL.Vec(IDL.Vec(IDL.Nat8)),
    coin_reserved: IDL.Vec(CoinBalance),
    attributes: IDL.Text,
    address: IDL.Text,
    nonce: IDL.Nat64,
    utxos: IDL.Vec(Utxo),
  });
  const PoolBasic = IDL.Record({ name: IDL.Text, address: IDL.Text });
  const PoolState = IDL.Record({
    k: IDL.Nat,
    id: IDL.Opt(IDL.Text),
    lp: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    lp_earnings: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
    utxo: IDL.Opt(Utxo),
    incomes: IDL.Nat64,
    nonce: IDL.Nat64,
  });
  const Result_5 = IDL.Variant({
    Ok: IDL.Opt(IDL.Tuple(IDL.Opt(PoolState), PoolState)),
    Err: IDL.Text,
  });
  const TxRecord = IDL.Record({ pools: IDL.Vec(IDL.Text) });
  const Result_6 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const LiquidityOffer = IDL.Record({
    output: CoinBalance,
    inputs: IDL.Opt(Utxo),
    nonce: IDL.Nat64,
  });
  const Result_7 = IDL.Variant({
    Ok: LiquidityOffer,
    Err: ExchangeError,
  });
  const DonateIntention = IDL.Record({
    out_rune: CoinBalance,
    out_sats: IDL.Nat64,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_8 = IDL.Variant({
    Ok: DonateIntention,
    Err: ExchangeError,
  });
  const ExtractFeeOffer = IDL.Record({
    output: CoinBalance,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_9 = IDL.Variant({
    Ok: ExtractFeeOffer,
    Err: ExchangeError,
  });
  const SwapOffer = IDL.Record({
    output: CoinBalance,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_10 = IDL.Variant({ Ok: SwapOffer, Err: ExchangeError });
  const UtxoToBeMerge = IDL.Record({
    out_rune: CoinBalance,
    out_sats: IDL.Nat64,
    nonce: IDL.Nat64,
    utxos: IDL.Vec(Utxo),
  });
  const Result_11 = IDL.Variant({
    Ok: UtxoToBeMerge,
    Err: ExchangeError,
  });
  const WithdrawalOffer = IDL.Record({
    nonce: IDL.Nat64,
    input: Utxo,
    user_outputs: IDL.Vec(CoinBalance),
  });
  const Result_12 = IDL.Variant({
    Ok: WithdrawalOffer,
    Err: ExchangeError,
  });
  const BlockInfo = IDL.Record({ height: IDL.Nat32, hash: IDL.Text });
  const Result_13 = IDL.Variant({
    Ok: IDL.Vec(BlockInfo),
    Err: IDL.Text,
  });
  const TxRecordInfo = IDL.Record({
    records: IDL.Vec(IDL.Text),
    txid: IDL.Text,
    confirmed: IDL.Bool,
  });
  const Result_14 = IDL.Variant({
    Ok: IDL.Vec(TxRecordInfo),
    Err: IDL.Text,
  });
  const RollbackTxArgs = IDL.Record({ txid: IDL.Text });
  return IDL.Service({
    blocks_tx_records_count: IDL.Func([], [Result], ["query"]),
    create: IDL.Func([IDL.Text], [Result_1], []),
    execute_tx: IDL.Func([ExecuteTxArgs], [Result_2], []),
    get_all_lp: IDL.Func([IDL.Text], [Result_3], ["query"]),
    get_block: IDL.Func([IDL.Nat32], [IDL.Opt(NewBlockInfo)], ["query"]),
    get_fee_collector: IDL.Func([], [IDL.Text], ["query"]),
    get_lp: IDL.Func([IDL.Text, IDL.Text], [Result_4], ["query"]),
    get_max_block: IDL.Func([], [IDL.Opt(NewBlockInfo)], ["query"]),
    get_minimal_tx_value: IDL.Func(
      [GetMinimalTxValueArgs],
      [IDL.Nat64],
      ["query"]
    ),
    get_pool_info: IDL.Func([GetPoolInfoArgs], [IDL.Opt(PoolInfo)], ["query"]),
    get_pool_list: IDL.Func([], [IDL.Vec(PoolBasic)], ["query"]),
    get_pool_state_chain: IDL.Func([IDL.Text, IDL.Text], [Result_5], ["query"]),
    get_tx_affected: IDL.Func([IDL.Text], [IDL.Opt(TxRecord)], ["query"]),
    list_pools: IDL.Func(
      [IDL.Opt(IDL.Text), IDL.Nat64],
      [IDL.Vec(PoolInfo)],
      ["query"]
    ),
    new_block: IDL.Func([NewBlockInfo], [Result_6], []),
    pause: IDL.Func([], [], []),
    pre_add_liquidity: IDL.Func([IDL.Text, CoinBalance], [Result_7], ["query"]),
    pre_donate: IDL.Func([IDL.Text, IDL.Nat64], [Result_8], ["query"]),
    pre_extract_fee: IDL.Func([IDL.Text], [Result_9], ["query"]),
    pre_swap: IDL.Func([IDL.Text, CoinBalance], [Result_10], ["query"]),
    pre_sync_with_btc: IDL.Func([IDL.Text], [Result_11], []),
    pre_withdraw_liquidity: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat],
      [Result_12],
      ["query"]
    ),
    query_blocks: IDL.Func([], [Result_13], ["query"]),
    query_tx_records: IDL.Func([], [Result_14], ["query"]),
    recover: IDL.Func([], [], []),
    rollback_tx: IDL.Func([RollbackTxArgs], [Result_6], []),
    set_fee_collector: IDL.Func([IDL.Text], [], []),
    set_orchestrator: IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }: { IDL: any }) => {
  return [];
};
