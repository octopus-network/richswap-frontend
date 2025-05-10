import { UnspentOutput, ToSignInput, AddressType } from "@/types";

import { UTXO_DUST, BITCOIN } from "@/lib/constants";
import { Transaction } from "@/lib/transaction";
import { getAddressType, addressTypeToString } from "../address";
import { RuneId, Runestone, none, Edict } from "runelib";
import { Orchestrator } from "@/lib/orchestrator";
import { selectBtcUtxos } from "./common";
import * as bitcoin from "bitcoinjs-lib";

export async function depositTx({
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

  poolUtxos.forEach((utxo) => {
    // pool has only one utxo now
    const rune = utxo.runes.find((rune) => rune.id === runeid);
    poolRuneAmount += BigInt(rune!.amount);
    poolBtcAmount += BigInt(utxo.satoshis);
    tx.addInput(utxo);
  });

  let inputUtxoDusts = BigInt(0);
  // add assets
  runeUtxos.forEach((v) => {
    tx.addInput(v);
    inputUtxoDusts += BigInt(v.satoshis);
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

  const poolSpendUtxos = poolUtxos.map((utxo) => `${utxo.txid}:${utxo.vout}`);
  const poolVouts: number[] = [];

  if (needChange) {
    tx.addOutput(address, UTXO_DUST);
    poolVouts.push(1);
  } else {
    poolVouts.push(0);
  }

  // send rune and btc to pool
  tx.addOutput(poolAddress, poolBtcAmount + btcAmount);

  const opReturnScript = runestone.encipher();
  // OP_RETURN
  tx.addScriptOutput(opReturnScript, BigInt(0));

  let inputTypes = [
    ...poolUtxos.map((utxo) =>
      addressTypeToString(getAddressType(utxo.address))
    ),
    ...runeUtxos.map((utxo) =>
      addressTypeToString(getAddressType(utxo.address))
    ),
  ];

  const outputTypes = [
    ...Array(needChange ? 1 : 0).fill(
      addressTypeToString(getAddressType(address))
    ),
    addressTypeToString(getAddressType(poolAddress)),
    { OpReturn: BigInt(opReturnScript.length) },
    // btc output
    addressTypeToString(getAddressType(paymentAddress)),
  ];

  let lastFee = BigInt(0);
  let currentFee = BigInt(0);
  let selectedUtxos: UnspentOutput[] = [];
  let targetBtcAmount = BigInt(0);
  let discardedSats = BigInt(0);

  const utxoDust = needChange ? UTXO_DUST : BigInt(0);

  do {
    lastFee = currentFee;

    currentFee = await Orchestrator.getEstimateMinTxFee({
      input_types: inputTypes,
      pool_address: [poolAddress],
      output_types: outputTypes,
    });

    currentFee += BigInt(1);
    targetBtcAmount = btcAmount + currentFee + utxoDust;
    if (currentFee > lastFee && targetBtcAmount > 0) {
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
        ...runeUtxos.map((utxo) =>
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
        outputTypes.pop();
        outputTypes.push(addressTypeToString(getAddressType(paymentAddress)));
      }

      selectedUtxos = _selectedUtxos;
    }
  } while (currentFee > lastFee && targetBtcAmount > 0);

  let totalBtcAmount = BigInt(0);

  selectedUtxos.forEach((utxo) => {
    tx.addInput(utxo);
    totalBtcAmount += BigInt(utxo.satoshis);
  });

  const changeBtcAmount = totalBtcAmount - targetBtcAmount + inputUtxoDusts;

  if (changeBtcAmount < 0) {
    throw new Error("Insufficient UTXO(s)");
  }

  if (changeBtcAmount > UTXO_DUST) {
    tx.addOutput(paymentAddress, changeBtcAmount);
  } else if (changeBtcAmount > BigInt(0)) {
    discardedSats = changeBtcAmount;
  }

  const inputs = tx.getInputs();

  const psbt = tx.toPsbt();

  //@ts-expect-error: todo
  const unsignedTx = psbt.__CACHE.__TX;

  const toSignInputs: ToSignInput[] = [];

  const toSpendUtxos = inputs
    .filter(({ utxo }, index) => {
      const isUserInput =
        utxo.address === address || utxo.address === paymentAddress;
      const addressType = getAddressType(utxo.address);
      if (isUserInput) {
        toSignInputs.push({
          index,
          ...(addressType === AddressType.P2TR
            ? { address: utxo.address, disableTweakSigner: false }
            : { publicKey: utxo.pubkey, disableTweakSigner: true }),
        });
      }
      return isUserInput;
    })
    .map((input) => input.utxo);

  const unsignedTxClone = unsignedTx.clone();

  for (let i = 0; i < toSignInputs.length; i++) {
    const toSignInput = toSignInputs[i];

    const toSignIndex = toSignInput.index;
    const input = inputs[toSignIndex];
    const inputAddress = input.utxo.address;
    if (!inputAddress) continue;
    const redeemScript = psbt.data.inputs[toSignIndex].redeemScript;
    const addressType = getAddressType(inputAddress);

    if (redeemScript && addressType === AddressType.P2SH_P2WPKH) {
      const finalScriptSig = bitcoin.script.compile([redeemScript]);
      unsignedTxClone.setInputScript(toSignIndex, finalScriptSig);
    }
  }

  const txid = unsignedTxClone.getId();

  const poolReceiveUtxos = poolVouts.map((vout) => `${txid}:${vout}`);

  return {
    psbt,
    toSpendUtxos,
    toSignInputs,
    poolSpendUtxos,
    poolReceiveUtxos,
    txid,
    fee: currentFee + discardedSats,
    inputCoins: [
      {
        from: paymentAddress,
        coin: {
          id: BITCOIN.id,
          value: btcAmount,
        },
      },
      {
        from: address,
        coin: {
          id: runeid,
          value: runeAmount,
        },
      },
    ],
    outputCoins: [],
  };
}
