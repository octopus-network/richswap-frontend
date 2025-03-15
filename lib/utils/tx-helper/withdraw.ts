import { UnspentOutput, InputCoin, OutputCoin, ToSignInput } from "@/types";

import { UTXO_DUST, BITCOIN } from "@/lib/constants";
import { Transaction } from "@/lib/transaction";

import { Orchestrator } from "@/lib/orchestrator";
import { addressTypeToString, getAddressType } from "../address";
import { RuneId, Runestone, none, Edict } from "runelib";
import { selectBtcUtxos } from "./common";

export async function withdrawTx({
  btcAmount,
  runeid,
  runeAmount,
  btcUtxos,
  poolUtxos,
  address,
  paymentAddress,
  poolAddress,
  feeRate,
}: {
  btcAmount: bigint;
  runeid: string;
  runeAmount: bigint;
  btcUtxos: UnspentOutput[];
  poolUtxos: UnspentOutput[];
  address: string;
  paymentAddress: string;
  poolAddress: string;
  feeRate: number;
}) {
  let poolRuneAmount = BigInt(0),
    poolBtcAmount = BigInt(0);

  const tx = new Transaction();

  tx.setFeeRate(feeRate);
  tx.setEnableRBF(false);
  tx.setChangeAddress(paymentAddress);

  poolUtxos.forEach((utxo) => {
    // pool has only one utxo now
    const rune = utxo.runes.find((rune) => rune.id === runeid);
    poolRuneAmount += BigInt(rune!.amount);
    poolBtcAmount += BigInt(utxo.satoshis);
    tx.addInput(utxo);
  });

  const changeRuneAmount = poolRuneAmount - runeAmount;

  const [runeBlock, runeIdx] = runeid.split(":");

  const needChange = changeRuneAmount > 0;

  const edicts = needChange
    ? [
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          changeRuneAmount,
          0
        ),
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          runeAmount,
          1
        ),
      ]
    : [
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          runeAmount,
          0
        ),
      ];

  const runestone = new Runestone(edicts, none(), none(), none());

  const poolSpendUtxos = poolUtxos.map((utxo) => `${utxo.txid}:${utxo.vout}`);
  const poolVouts: number[] = [];

  if (needChange) {
    tx.addOutput(poolAddress, poolBtcAmount - btcAmount);
    poolVouts.push(0);
  }

  // send rune to user
  tx.addOutput(address, UTXO_DUST);

  // send btc to user
  tx.addOutput(paymentAddress, btcAmount);

  const opReturnScript = runestone.encipher();
  // OP_RETURN
  tx.addScriptOutput(opReturnScript, BigInt(0));

  let inputTypes = [
    ...poolUtxos.map((utxo) =>
      addressTypeToString(getAddressType(utxo.address))
    ),
  ];

  const outputTypes = [
    ...Array(needChange ? 1 : 0).fill(
      addressTypeToString(getAddressType(poolAddress))
    ),
    addressTypeToString(getAddressType(address)),
    addressTypeToString(getAddressType(paymentAddress)),
    { OpReturn: BigInt(opReturnScript.length) },
    // fee output
    addressTypeToString(getAddressType(paymentAddress)),
  ];

  let lastFee = BigInt(0);
  let currentFee = BigInt(0);
  let selectedUtxos: UnspentOutput[] = [];
  let targetBtcAmount = BigInt(0);

  do {
    lastFee = currentFee;

    currentFee = await Orchestrator.getEstimateMinTxFee({
      input_types: inputTypes,
      pool_address: poolAddress,
      output_types: outputTypes,
    });

    currentFee += BigInt(1);

    if (currentFee > lastFee) {
      outputTypes.pop();

      targetBtcAmount = currentFee + UTXO_DUST;

      const { selectedUtxos: _selectedUtxos } = selectBtcUtxos(
        btcUtxos,
        targetBtcAmount
      );
      if (_selectedUtxos.length === 0) {
        throw new Error("INSUFFICIENT_BTC_UTXO");
      }

      inputTypes = [
        ...poolUtxos.map((utxo) =>
          addressTypeToString(getAddressType(utxo.address))
        ),
        ..._selectedUtxos.map(() =>
          addressTypeToString(getAddressType(paymentAddress))
        ),
      ];

      const totalBtcAmount = _selectedUtxos.reduce(
        (total, curr) => total + BigInt(curr.satoshis),
        BigInt(0)
      );

      if (
        totalBtcAmount - targetBtcAmount > 0 &&
        totalBtcAmount - targetBtcAmount > UTXO_DUST
      ) {
        outputTypes.push(addressTypeToString(getAddressType(paymentAddress)));
      }

      selectedUtxos = _selectedUtxos;
    }
  } while (currentFee > lastFee);

  let totalBtcAmount = BigInt(0);

  selectedUtxos.forEach((utxo) => {
    tx.addInput(utxo);
    totalBtcAmount += BigInt(utxo.satoshis);
  });

  const changeBtcAmount = totalBtcAmount - targetBtcAmount;

  if (changeBtcAmount < 0) {
    throw new Error("Inssuficient UTXO(s)");
  }

  if (changeBtcAmount > UTXO_DUST) {
    tx.addOutput(paymentAddress, changeBtcAmount);
  }
  const inputs = tx.getInputs();

  const psbt = tx.toPsbt();

  //@ts-expect-error: todo
  const unsignedTx = psbt.__CACHE.__TX;
  const txid = unsignedTx.getId();

  const poolReceiveUtxos = poolVouts.map((vout) => `${txid}:${vout}`);

  const toSignInputs: ToSignInput[] = [];

  const toSpendUtxos = inputs
    .filter(({ utxo }, index) => {
      const isUserInput =
        utxo.address === address || utxo.address === paymentAddress;
      if (isUserInput) {
        toSignInputs.push({
          publicKey: utxo.pubkey,
          address: utxo.address,
          index,
        });
      }
      return isUserInput;
    })
    .map((input) => input.utxo);

  const inputCoins: InputCoin[] = [];

  const outputCoins: OutputCoin[] = [
    {
      to: paymentAddress,
      coin: {
        id: BITCOIN.id,
        value: btcAmount,
      },
    },
    {
      to: address,
      coin: {
        id: runeid,
        value: runeAmount,
      },
    },
  ];

  return {
    psbt,
    poolSpendUtxos,
    poolReceiveUtxos,
    toSpendUtxos,
    toSignInputs,
    txid,
    fee: currentFee,
    inputCoins,
    outputCoins,
  };
}
