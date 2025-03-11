export const idlFactory = ({ IDL }: { IDL: any }) => {
  const TxOutputType = IDL.Variant({
    P2WPKH: IDL.Null,
    OpReturn: IDL.Nat64,
    P2TR: IDL.Null,
  });
  const EstimateMinTxFeeArgs = IDL.Record({
    input_types: IDL.Vec(TxOutputType),
    pool_address: IDL.Text,
    output_types: IDL.Vec(TxOutputType),
  });
  const Result = IDL.Variant({ Ok: IDL.Nat64, Err: IDL.Text });
  const ExchangePool = IDL.Record({
    exchange_id: IDL.Text,
    pool_address: IDL.Text,
    pool_key: IDL.Text,
  });
  const GetFailedInvokeLogArgs = IDL.Variant({
    All: IDL.Null,
    ByTxid: IDL.Text,
    ByAddress: IDL.Text,
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const RollbackStepLogView = IDL.Record({
    result: Result_1,
    exchange_id: IDL.Text,
    txid: IDL.Text,
    rollback_time: IDL.Text,
    maybe_return_time: IDL.Opt(IDL.Text),
    pool_address: IDL.Text,
  });
  const Result_2 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const ExecutionStepLogView = IDL.Record({
    result: Result_2,
    exchange_id: IDL.Text,
    maybe_return_time: IDL.Opt(IDL.Text),
    calling_method: IDL.Text,
    calling_args: IDL.Text,
    pool_address: IDL.Text,
    calling_time: IDL.Text,
  });
  const InvokeLogView = IDL.Record({
    tx_sent_time: IDL.Opt(IDL.Text),
    rollback_steps: IDL.Vec(RollbackStepLogView),
    execution_steps: IDL.Vec(ExecutionStepLogView),
    processing_result: Result_2,
    calling_args: IDL.Text,
    calling_time: IDL.Text,
  });
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
    initiator_address: IDL.Text,
    intentions: IDL.Vec(Intention),
  });
  const InvokeArgs = IDL.Record({
    intention_set: IntentionSet,
    psbt_hex: IDL.Text,
  });
  const MempoolTxFeeRateView = IDL.Record({
    low: IDL.Nat64,
    high: IDL.Nat64,
    update_time: IDL.Text,
    medium: IDL.Nat64,
  });
  const BlockBasic = IDL.Record({
    block_hash: IDL.Text,
    block_height: IDL.Nat32,
  });
  const ReceivedBlockView = IDL.Record({
    processing_results: IDL.Vec(IDL.Text),
    block_basic: BlockBasic,
    txids: IDL.Vec(IDL.Text),
    received_time: IDL.Text,
  });
  const ExchangeStatus = IDL.Variant({
    Active: IDL.Null,
    Halted: IDL.Record({ txid: IDL.Text }),
  });
  const ExchangeView = IDL.Record({
    status: ExchangeStatus,
    exchange_id: IDL.Text,
    name: IDL.Text,
    canister_id: IDL.Principal,
    description: IDL.Text,
  });
  const RejectedTxView = IDL.Record({
    rollback_results: IDL.Vec(IDL.Text),
    txid: IDL.Text,
    received_time: IDL.Text,
    reason: IDL.Text,
  });
  const BitcoinNetwork = IDL.Variant({
    mainnet: IDL.Null,
    regtest: IDL.Null,
    testnet: IDL.Null,
  });
  const OrchestratorSettings = IDL.Record({
    min_tx_confirmations: IDL.Nat32,
    mempool_connector_principal: IDL.Principal,
    max_unconfirmed_tx_count_in_pool: IDL.Nat32,
    min_btc_amount_for_utxo: IDL.Nat64,
    rune_indexer_principal: IDL.Principal,
    max_intentions_per_invoke: IDL.Nat32,
    bitcoin_network: BitcoinNetwork,
  });
  const SignPsbtArgs = IDL.Record({
    zero_confirmed_tx_count_in_queue: IDL.Nat32,
    txid: IDL.Text,
    intention_set: IntentionSet,
    intention_index: IDL.Nat32,
    psbt_hex: IDL.Text,
  });
  const TxStatus = IDL.Variant({
    Confirmed: IDL.Nat32,
    Rejected: IDL.Text,
    Pending: IDL.Null,
  });
  const TxDetailView = IDL.Record({
    status: IDL.Opt(TxStatus),
    invoke_log: InvokeLogView,
    included_block: IDL.Opt(BlockBasic),
    sent_tx_hex: IDL.Text,
  });
  const OutpointWithValue = IDL.Record({
    maybe_rune: IDL.Opt(CoinBalance),
    value: IDL.Nat64,
    script_pubkey_hex: IDL.Text,
    outpoint: IDL.Text,
  });
  const NewBlockDetectedArgs = IDL.Record({
    block_hash: IDL.Text,
    tx_ids: IDL.Vec(IDL.Text),
    block_height: IDL.Nat32,
  });
  const ExchangeMetadata = IDL.Record({
    principal: IDL.Principal,
    exchange_id: IDL.Text,
    name: IDL.Text,
    description: IDL.Text,
  });
  return IDL.Service({
    estimate_min_tx_fee: IDL.Func([EstimateMinTxFeeArgs], [Result], ["query"]),
    get_exchange_pools: IDL.Func([], [IDL.Vec(ExchangePool)], ["query"]),
    get_failed_invoke_logs: IDL.Func(
      [GetFailedInvokeLogArgs],
      [IDL.Vec(IDL.Tuple(IDL.Text, InvokeLogView))],
      ["query"]
    ),
    get_invoke_args_of_failed_invoke: IDL.Func(
      [IDL.Text],
      [IDL.Opt(InvokeArgs)],
      ["query"]
    ),
    get_last_sent_txs: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Opt(IDL.Nat32)))],
      ["query"]
    ),
    get_mempool_tx_fee_rate: IDL.Func([], [MempoolTxFeeRateView], ["query"]),
    get_received_blocks: IDL.Func(
      [IDL.Opt(IDL.Nat32), IDL.Opt(IDL.Bool)],
      [IDL.Vec(ReceivedBlockView)],
      ["query"]
    ),
    get_registered_exchanges: IDL.Func([], [IDL.Vec(ExchangeView)], ["query"]),
    get_rejected_txs: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(RejectedTxView)],
      ["query"]
    ),
    get_settings: IDL.Func([], [OrchestratorSettings], ["query"]),
    get_sign_psbt_args_of_failed_invoke: IDL.Func(
      [IDL.Text, IDL.Nat64],
      [IDL.Opt(SignPsbtArgs)],
      ["query"]
    ),
    get_tx_for_outpoint: IDL.Func(
      [IDL.Text],
      [IDL.Opt(TxDetailView)],
      ["query"]
    ),
    get_tx_queue_of_pool: IDL.Func(
      [IDL.Text],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Opt(IDL.Opt(IDL.Nat32))))],
      ["query"]
    ),
    get_tx_sent: IDL.Func([IDL.Text], [IDL.Opt(TxDetailView)], ["query"]),
    get_used_outpoints: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      ["query"]
    ),
    get_zero_confirmed_tx_count_of_pool: IDL.Func(
      [IDL.Text],
      [IDL.Nat32],
      ["query"]
    ),
    get_zero_confirmed_txs: IDL.Func(
      [IDL.Opt(IDL.Text)],
      [IDL.Vec(IDL.Text)],
      ["query"]
    ),
    get_zero_confirmed_utxos_of_address: IDL.Func(
      [IDL.Text],
      [IDL.Vec(OutpointWithValue)],
      ["query"]
    ),
    invoke: IDL.Func([InvokeArgs], [Result_2], []),
    new_block_detected: IDL.Func([NewBlockDetectedArgs], [Result_1], []),
    register_exchange: IDL.Func([ExchangeMetadata], [Result_1], []),
    reject_tx: IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    version: IDL.Func([], [IDL.Text], ["query"]),
  });
};
