export const idlFactory = ({ IDL }: { IDL: any }) => {
  const ExchangeError = IDL.Variant({
    InvalidNumeric: IDL.Null,
    Overflow: IDL.Null,
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
    tx_id: IDL.Text,
    pool_id: IDL.Text,
  });
  const CoinMeta = IDL.Record({
    id: IDL.Text,
    min_amount: IDL.Nat,
    symbol: IDL.Text,
  });
  const CoinBalance = IDL.Record({ id: IDL.Text, value: IDL.Nat });
  const Utxo = IDL.Record({
    satoshis: IDL.Nat64,
    balance: CoinBalance,
    txid: IDL.Text,
    vout: IDL.Nat32,
  });
  const PoolState = IDL.Record({
    k: IDL.Nat,
    id: IDL.Opt(IDL.Text),
    lp: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    utxo: IDL.Opt(Utxo),
    incomes: IDL.Nat64,
    nonce: IDL.Nat64,
  });
  const LiquidityPoolWithState = IDL.Record({
    addr: IDL.Text,
    meta: CoinMeta,
    pubkey: IDL.Text,
    state: IDL.Opt(PoolState),
    fee_rate: IDL.Nat64,
    tweaked: IDL.Text,
  });
  const PoolMeta = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    coins: IDL.Vec(IDL.Text),
    address: IDL.Text,
  });
  const LiquidityOffer = IDL.Record({
    output: CoinBalance,
    inputs: IDL.Opt(Utxo),
    nonce: IDL.Nat64,
  });
  const Result_1 = IDL.Variant({
    Ok: LiquidityOffer,
    Err: ExchangeError,
  });
  const SwapOffer = IDL.Record({
    output: CoinBalance,
    nonce: IDL.Nat64,
    input: Utxo,
  });
  const Result_2 = IDL.Variant({ Ok: SwapOffer, Err: ExchangeError });
  const WithdrawalOffer = IDL.Record({
    nonce: IDL.Nat64,
    input: Utxo,
    user_outputs: IDL.Vec(CoinBalance),
  });
  const Result_3 = IDL.Variant({
    Ok: WithdrawalOffer,
    Err: ExchangeError,
  });
  const InputRune = IDL.Record({
    tx_id: IDL.Text,
    coin_balance: IDL.Opt(CoinBalance),
    vout: IDL.Nat32,
    btc_amount: IDL.Nat64,
  });
  const OutputRune = IDL.Record({
    coin_balance: IDL.Opt(CoinBalance),
    btc_amount: IDL.Nat64,
  });
  const AssetWithOwner = IDL.Record({
    coin_balance: CoinBalance,
    owner_address: IDL.Text,
  });
  const ReeInstruction = IDL.Record({
    input_coins: IDL.Vec(AssetWithOwner),
    method: IDL.Text,
    output_coins: IDL.Vec(AssetWithOwner),
    exchange_id: IDL.Text,
    nonce: IDL.Opt(IDL.Nat64),
    pool_id: IDL.Opt(IDL.Text),
  });
  const SignPsbtArgs = IDL.Record({
    tx_id: IDL.Text,
    zero_confirmed_tx_count_in_queue: IDL.Nat32,
    input_runes: IDL.Vec(InputRune),
    output_runes: IDL.Vec(OutputRune),
    instruction: ReeInstruction,
    psbt_hex: IDL.Text,
  });
  const Result_4 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  return IDL.Service({
    create: IDL.Func([IDL.Text], [Result], []),
    finalize_tx: IDL.Func([FinalizeTxArgs], [], []),
    find_pool: IDL.Func(
      [IDL.Text],
      [IDL.Opt(LiquidityPoolWithState)],
      ["query"]
    ),
    get_fee_collector: IDL.Func([], [IDL.Text], ["query"]),
    list_pools: IDL.Func([], [IDL.Vec(PoolMeta)], ["query"]),
    manually_transfer: IDL.Func(
      [IDL.Text, IDL.Nat32, IDL.Nat64],
      [IDL.Opt(IDL.Text)],
      []
    ),
    pre_add_liquidity: IDL.Func([IDL.Text, CoinBalance], [Result_1], ["query"]),
    pre_swap: IDL.Func([IDL.Text, CoinBalance], [Result_2], ["query"]),
    pre_withdraw_liquidity: IDL.Func(
      [IDL.Text, IDL.Text],
      [Result_3],
      ["query"]
    ),
    rollback_tx: IDL.Func([FinalizeTxArgs], [], []),
    set_fee_collector: IDL.Func([IDL.Text], [], []),
    set_orchestrator: IDL.Func([IDL.Principal], [], []),
    sign_psbt: IDL.Func([SignPsbtArgs], [Result_4], []),
    test_reorg_outputs: IDL.Func([], [], []),
  });
};
