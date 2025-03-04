import { UnspentOutput } from "@/types";

import { ToSignInput } from "@/types";
import { BITCOIN, UTXO_DUST } from "@/lib/constants";
import { Transaction } from "@/lib/transaction";

import { InputCoin, OutputCoin } from "@/types";
import { RuneId, Runestone, none, Edict } from "runelib";

export function swapRuneTx({
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

  const toSignInputs: ToSignInput[] = [];

  poolUtxos.forEach((utxo) => {
    // pool has only one utxo now
    const rune = utxo.runes.find((rune) => rune.id === runeid);
    poolRuneAmount += BigInt(rune!.amount);
    poolBtcAmount += BigInt(utxo.satoshis);
    tx.addInput(utxo);
  });

  const [runeBlock, runeIdx] = runeid.split(":");

  const changeRuneAmount = poolRuneAmount - runeAmount;

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
    tx.addOutput(poolAddress, poolBtcAmount + btcAmount);
    poolVouts.push(0);
  }

  // send rune to user
  tx.addOutput(address, UTXO_DUST);

  if (!needChange) {
    tx.addOutput(poolAddress, poolBtcAmount + btcAmount);
    poolVouts.push(1);
  }

  // OP_RETURN
  tx.addScriptOutput(runestone.encipher(), BigInt(0));

  const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos, true);

  toSignInputs.push(..._toSignInputs);

  const inputs = tx.getInputs();

  const psbt = tx.toPsbt();

  //@ts-expect-error: todo
  const unsignedTx = psbt.__CACHE.__TX;
  const txid = unsignedTx.getId();

  const poolReceiveUtxos = poolVouts.map((vout) => `${txid}:${vout}`);

  const toSpendUtxos = inputs
    .filter(
      (input) =>
        input.utxo.address === address || input.utxo.address === paymentAddress
    )
    .map((input) => input.utxo);

  const inputCoins: InputCoin[] = [
    {
      from: paymentAddress,
      coin: {
        id: BITCOIN.id,
        value: btcAmount,
      },
    },
  ];

  const outputCoins: OutputCoin[] = [
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
    toSignInputs,
    toSpendUtxos,
    poolSpendUtxos,
    poolReceiveUtxos,
    txid,
    inputCoins,
    outputCoins,
  };
}
