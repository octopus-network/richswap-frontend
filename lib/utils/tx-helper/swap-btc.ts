import { UnspentOutput } from "@/types";

import { ToSignInput } from "@/types";
import { UTXO_DUST } from "@/lib/constants";
import { Transaction } from "@/lib/transaction";

import { RuneId, Runestone, none, Edict } from "runelib";

export function swapBtcTx({
  btcAmount,
  runeid,
  runeAmount,
  btcUtxos,
  runeUtxos,
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
  runeUtxos: UnspentOutput[];
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

  // add assets
  runeUtxos.forEach((v, index) => {
    tx.addInput(v);
    toSignInputs.push({ index, publicKey: v.pubkey });
  });

  let fromRuneAmount = BigInt(0);
  let hasMultipleRunes = false;
  const runesMap: Record<string, boolean> = {};
  runeUtxos.forEach((v) => {
    if (v.runes) {
      v.runes.forEach((w) => {
        runesMap[w.id] = true;
        if (w.id === runeid) {
          fromRuneAmount = fromRuneAmount + BigInt(w.amount);
        }
      });
    }
  });

  if (Object.keys(runesMap).length > 1) {
    hasMultipleRunes = true;
  }

  const changeRuneAmount = fromRuneAmount - runeAmount;

  const [runeBlock, runeIdx] = runeid.split(":");

  const needChange = hasMultipleRunes || changeRuneAmount > 0;

  const edicts = needChange
    ? [
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          changeRuneAmount,
          0
        ),
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          poolRuneAmount + runeAmount,
          1
        ),
      ]
    : [
        new Edict(
          new RuneId(Number(runeBlock), Number(runeIdx)),
          poolRuneAmount + runeAmount,
          0
        ),
      ];

  const runestone = new Runestone(edicts, none(), none(), none());

  if (needChange) {
    tx.addOutput(address, UTXO_DUST);
  }

  // send rune to pool
  tx.addOutput(poolAddress, poolBtcAmount - btcAmount);

  // send btc to user
  tx.addOutput(paymentAddress, btcAmount);

  // OP_RETURN
  tx.addScriptOutput(runestone.encipher(), BigInt(0));

  const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos, true);
  toSignInputs.push(..._toSignInputs);

  const inputs = tx.getInputs();

  const psbt = tx.toPsbt();

  const toSpendUtxos = inputs
    .filter(
      (input) =>
        input.utxo.address === address || input.utxo.address === paymentAddress
    )
    .map((input) => input.utxo);

  return { psbt, toSignInputs, toSpendUtxos };
}
