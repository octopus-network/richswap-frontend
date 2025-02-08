export const idlFactory = ({ IDL }: { IDL: any }) => {
  const Result = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const FromUserRecord = IDL.Record({ user_id: IDL.Principal });
  const FromCanisterRecord = IDL.Record({
    canister_version: IDL.Opt(IDL.Nat64),
    canister_id: IDL.Principal,
  });
  const CanisterChangeOrigin = IDL.Variant({
    from_user: FromUserRecord,
    from_canister: FromCanisterRecord,
  });
  const CreationRecord = IDL.Record({ controllers: IDL.Vec(IDL.Principal) });
  const CodeDeploymentMode = IDL.Variant({
    reinstall: IDL.Null,
    upgrade: IDL.Null,
    install: IDL.Null,
  });
  const CodeDeploymentRecord = IDL.Record({
    mode: CodeDeploymentMode,
    module_hash: IDL.Vec(IDL.Nat8),
  });
  const LoadSnapshotRecord = IDL.Record({
    canister_version: IDL.Nat64,
    taken_at_timestamp: IDL.Nat64,
    snapshot_id: IDL.Vec(IDL.Nat8),
  });
  const CanisterChangeDetails = IDL.Variant({
    creation: CreationRecord,
    code_deployment: CodeDeploymentRecord,
    load_snapshot: LoadSnapshotRecord,
    controllers_change: CreationRecord,
    code_uninstall: IDL.Null,
  });
  const CanisterChange = IDL.Record({
    timestamp_nanos: IDL.Nat64,
    canister_version: IDL.Nat64,
    origin: CanisterChangeOrigin,
    details: CanisterChangeDetails,
  });
  const CanisterInfoResponse = IDL.Record({
    controllers: IDL.Vec(IDL.Principal),
    module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
    recent_changes: IDL.Vec(CanisterChange),
    total_num_changes: IDL.Nat64,
  });
  const Result_1 = IDL.Variant({
    Ok: CanisterInfoResponse,
    Err: IDL.Text,
  });
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
  const Result_2 = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const ExecutionStepLogView = IDL.Record({
    result: Result_2,
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
    processing_result: Result_2,
    calling_args: IDL.Text,
    calling_time: IDL.Text,
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
  const SignPsbtArgs = IDL.Record({
    tx_id: IDL.Text,
    zero_confirmed_tx_count_in_queue: IDL.Nat32,
    instruction_index: IDL.Nat32,
    input_runes: IDL.Vec(InputRune),
    output_runes: IDL.Vec(OutputRune),
    all_instructions: IDL.Vec(ReeInstruction),
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
  const RollbackStepLog = IDL.Record({
    result: Result,
    exchange_id: IDL.Text,
    tx_id: IDL.Text,
    rollback_time: IDL.Nat64,
    maybe_return_time: IDL.Opt(IDL.Nat64),
    pool_key: IDL.Text,
  });
  const ExecutionStepLog = IDL.Record({
    result: Result_2,
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
    processing_result: Result_2,
    calling_args: IDL.Text,
    calling_time: IDL.Nat64,
  });
  const InvokeError = IDL.Variant({
    InvalidOutpointForAddress: IDL.Record({
      value: IDL.Nat64,
      address: IDL.Text,
      available_utxos: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
      outpoint: IDL.Text,
    }),
    NoSignedAddressFound: IDL.Null,
    InvalidPsbtHex: IDL.Text,
    InvokeIsPaused: IDL.Null,
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
  const Result_3 = IDL.Variant({ Ok: IDL.Text, Err: InvokeError });
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
    clean_failed_invoke_logs: IDL.Func(
      [IDL.Opt(IDL.Nat64), IDL.Vec(IDL.Text)],
      [Result],
      []
    ),
    clean_tx_queue_for_pools: IDL.Func([], [Result], []),
    clear_finalized_txs: IDL.Func([], [Result], []),
    clear_last_block: IDL.Func([], [Result], []),
    get_canister_info: IDL.Func([IDL.Nat64], [Result_1], []),
    get_exchange_pools: IDL.Func([], [IDL.Vec(ExchangePool)], ["query"]),
    get_failed_invoke_logs: IDL.Func(
      [IDL.Opt(IDL.Text)],
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
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      ["query"]
    ),
    get_latency_logs: IDL.Func([], [IDL.Vec(IDL.Text)], ["query"]),
    get_mempool_tx_fee_rate: IDL.Func([], [MempoolTxFeeRateView], ["query"]),
    get_received_blocks: IDL.Func(
      [IDL.Opt(IDL.Nat32), IDL.Opt(IDL.Bool)],
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
    invoke: IDL.Func([InvokeArgs], [Result_3], []),
    new_block_detected: IDL.Func([NewBlockDetectedArgs], [Result], []),
    pause_invoke: IDL.Func([], [Result], []),
    register_exchange: IDL.Func([ExchangeMetadata], [Result], []),
    reject_tx: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    remove_tx_detail: IDL.Func([IDL.Text], [Result], []),
    remove_tx_from_pool: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    resume_invoke: IDL.Func([], [Result], []),
    rollback_tx_for_pool: IDL.Func([ExchangePool, IDL.Text], [Result], []),
    save_included_block_for_tx: IDL.Func([IDL.Text, BlockBasic], [Result], []),
    set_bitcoin_network: IDL.Func([BitcoinNetwork], [Result], []),
    set_mempool_connector_principal: IDL.Func([IDL.Principal], [Result], []),
    set_ord_canister_id: IDL.Func([IDL.Principal], [Result], []),
    set_tx_fee_per_vbyte: IDL.Func([SetTxFeePerVbyteArgs], [Result], []),
    unhalt_exchange: IDL.Func([IDL.Text], [Result], []),
  });
};
