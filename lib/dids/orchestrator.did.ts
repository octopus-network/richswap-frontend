export const idlFactory = ({ IDL }: { IDL: any }) => {
  const Result = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const ExchangePool = IDL.Record({
    exchange_id: IDL.Text,
    pool_key: IDL.Text,
  });
  const RollbackStepLogView = IDL.Record({
    result: Result,
    exchange_id: IDL.Text,
    tx_id: IDL.Text,
    rollback_time: IDL.Text,
    maybe_return_time: IDL.Opt(IDL.Text),
    pool_key: IDL.Text,
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const ExecutionStepLogView = IDL.Record({
    result: Result_1,
    exchange_id: IDL.Text,
    maybe_pool_id: IDL.Opt(IDL.Text),
    maybe_return_time: IDL.Opt(IDL.Text),
    calling_method: IDL.Text,
    calling_args: IDL.Text,
    calling_time: IDL.Text,
  });
  const InvokeLogView = IDL.Record({
    tx_sent_time: IDL.Opt(IDL.Text),
    rollback_steps: IDL.Vec(RollbackStepLogView),
    execution_steps: IDL.Vec(ExecutionStepLogView),
    processing_result: Result_1,
    calling_args: IDL.Text,
    calling_time: IDL.Text,
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
    tx_ids: IDL.Vec(IDL.Text),
    received_time: IDL.Text,
  });
  const ExchangeMetadata = IDL.Record({
    exchange_id: IDL.Text,
    name: IDL.Text,
    canister_id: IDL.Principal,
    description: IDL.Text,
  });
  const RejectedTxView = IDL.Record({
    rollback_results: IDL.Vec(IDL.Text),
    tx_id: IDL.Text,
    received_time: IDL.Text,
    reason: IDL.Text,
  });
  const BitcoinNetwork = IDL.Variant({
    mainnet: IDL.Null,
    regtest: IDL.Null,
    testnet: IDL.Null,
  });
  const OrchestratorSettings = IDL.Record({
    max_instructions_per_invoke: IDL.Nat32,
    ord_canister_id: IDL.Principal,
    min_tx_confirmations: IDL.Nat32,
    mempool_connector_principal: IDL.Principal,
    max_unconfirmed_tx_count_in_pool: IDL.Nat32,
    min_btc_amount_for_utxo: IDL.Nat64,
    bitcoin_network: BitcoinNetwork,
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
  const CoinBalance = IDL.Record({ id: IDL.Text, value: IDL.Nat });
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
    pool_key: IDL.Opt(IDL.Text),
  });
  const ReeInstructionSet = IDL.Record({ steps: IDL.Vec(ReeInstruction) });
  const InvokeArgs = IDL.Record({
    instruction_set: ReeInstructionSet,
    psbt_hex: IDL.Text,
  });
  const PsbtHexSource = IDL.Variant({
    FromExchange: IDL.Text,
    FromInstruction: IDL.Null,
  });
  const RollbackStepLog = IDL.Record({
    result: Result,
    exchange_id: IDL.Text,
    tx_id: IDL.Text,
    rollback_time: IDL.Nat64,
    maybe_return_time: IDL.Opt(IDL.Nat64),
    pool_key: IDL.Text,
  });
  const ExecutionStepLog = IDL.Record({
    result: Result_1,
    exchange_id: IDL.Text,
    maybe_return_time: IDL.Opt(IDL.Nat64),
    maybe_pool_key: IDL.Opt(IDL.Text),
    calling_method: IDL.Text,
    calling_args: IDL.Text,
    calling_time: IDL.Nat64,
  });
  const InvokeLog = IDL.Record({
    maybe_tx_sent_time: IDL.Opt(IDL.Nat64),
    rollback_steps: IDL.Vec(RollbackStepLog),
    execution_steps: IDL.Vec(ExecutionStepLog),
    processing_result: Result_1,
    calling_args: IDL.Text,
    calling_time: IDL.Nat64,
  });
  const InvokeError = IDL.Variant({
    InvalidOutpointForAddress: IDL.Record({
      address: IDL.Text,
      available_utxos: IDL.Vec(IDL.Text),
      outpoint: IDL.Text,
    }),
    NoSignedAddressFound: IDL.Null,
    InvalidPsbtHex: PsbtHexSource,
    ErrorOccurredDuringExecution: InvokeLog,
    InvalidPsbt: IDL.Text,
    TooManyInstructions: IDL.Record({
      max_instructions_per_invoke: IDL.Nat32,
      actual_instructions: IDL.Nat32,
    }),
    FailedToQueryUtxos: IDL.Record({
      error: IDL.Text,
      address: IDL.Text,
    }),
    MultipleSignedAddresses: IDL.Text,
    NoInstructions: IDL.Null,
    FailedToParsePsbt: IDL.Text,
    InvalidInstruction: IDL.Record({
      instruction_index: IDL.Nat32,
      reason: IDL.Text,
    }),
    InputAlreadySpent: IDL.Text,
  });
  const Result_2 = IDL.Variant({ Ok: IDL.Text, Err: InvokeError });
  const NewBlockDetectedArgs = IDL.Record({
    block_hash: IDL.Text,
    tx_ids: IDL.Vec(IDL.Text),
    block_height: IDL.Nat32,
  });
  const SetTxFeePerVbyteArgs = IDL.Record({
    low: IDL.Nat64,
    high: IDL.Nat64,
    medium: IDL.Nat64,
  });
  return IDL.Service({
    clear_last_block: IDL.Func([], [Result], []),
    get_exchange_pools: IDL.Func([], [IDL.Vec(ExchangePool)], ["query"]),
    get_failed_invoke_logs: IDL.Func(
      [IDL.Opt(IDL.Text)],
      [IDL.Vec(InvokeLogView)],
      ["query"]
    ),
    get_last_sent_txs: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      ["query"]
    ),
    get_mempool_tx_fee_rate: IDL.Func([], [MempoolTxFeeRateView], ["query"]),
    get_received_block_basics: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(BlockBasic)],
      ["query"]
    ),
    get_received_blocks: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(ReceivedBlockView)],
      ["query"]
    ),
    get_recommended_tx_fee_per_vbyte: IDL.Func(
      [IDL.Opt(IDL.Text)],
      [IDL.Nat64],
      ["query"]
    ),
    get_registered_exchanges: IDL.Func(
      [],
      [IDL.Vec(ExchangeMetadata)],
      ["query"]
    ),
    get_rejected_txs: IDL.Func(
      [IDL.Opt(IDL.Nat32)],
      [IDL.Vec(RejectedTxView)],
      ["query"]
    ),
    get_settings: IDL.Func([], [OrchestratorSettings], ["query"]),
    get_tx_for_outpoint: IDL.Func(
      [IDL.Text],
      [IDL.Opt(TxDetailView)],
      ["query"]
    ),
    get_tx_queue_of_pool: IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ["query"]),
    get_tx_sent: IDL.Func([IDL.Text], [IDL.Opt(TxDetailView)], ["query"]),
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
      [IDL.Vec(IDL.Text)],
      ["query"]
    ),
    invoke: IDL.Func([InvokeArgs], [Result_2], []),
    new_block_detected: IDL.Func([NewBlockDetectedArgs], [Result], []),
    register_exchange: IDL.Func([ExchangeMetadata], [Result], []),
    reject_tx: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    remove_tx_detail: IDL.Func([IDL.Text], [Result], []),
    remove_tx_from_pool: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    save_included_block_for_tx: IDL.Func([IDL.Text, BlockBasic], [Result], []),
    set_bitcoin_network: IDL.Func([BitcoinNetwork], [Result], []),
    set_mempool_connector_principal: IDL.Func([IDL.Principal], [Result], []),
    set_ord_canister_id: IDL.Func([IDL.Principal], [Result], []),
    set_tx_fee_per_vbyte: IDL.Func([SetTxFeePerVbyteArgs], [Result], []),
  });
};
