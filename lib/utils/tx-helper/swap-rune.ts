import { UnspentOutput, ToSignInput } from "@/types";

import { BITCOIN, UTXO_DUST, EXCHANGE_ID } from "@/lib/constants";
import { Transaction } from "@/lib/transaction";

import { RuneId, Runestone, none, Edict } from "runelib";
import { addressTypeToString, getAddressType } from "@/lib/utils/address";
import { Orchestrator } from "@/lib/orchestrator";
import { selectBtcUtxos } from "./common";
import { AddressType } from "@/types";
import * as bitcoin from "bitcoinjs-lib";

export async function swapRuneTx({
  btcAmount,
  runeid,
  runeAmount,
  btcUtxos,
  poolUtxos,
  address,
  paymentAddress,
  poolAddress,
  feeRate,
  nonce,
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
  nonce: bigint;
}) {
  let poolRuneAmount = BigInt(0),
    poolBtcAmount = BigInt(0);

  const tx = new Transaction();
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(false);
  tx.setChangeAddress(paymentAddress);

  // Add pool UTXOs
  poolUtxos.forEach((utxo) => {
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

  if (needChange) {
    tx.addOutput(poolAddress, poolBtcAmount + btcAmount);
  }
  tx.addOutput(address, UTXO_DUST);
  if (!needChange) {
    tx.addOutput(poolAddress, poolBtcAmount + btcAmount);
  }

  const opReturnScript = runestone.encipher();
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
    ...Array(!needChange ? 1 : 0).fill(
      addressTypeToString(getAddressType(poolAddress))
    ),
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
      pool_address: [poolAddress],
      output_types: outputTypes,
    });

    currentFee += BigInt(1);

    if (currentFee > lastFee) {
      targetBtcAmount = btcAmount + currentFee + UTXO_DUST;

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
        outputTypes.pop();
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

  const poolVouts = needChange ? [0] : [1];

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

  return {
    psbt,
    toSpendUtxos,
    toSignInputs,
    txid,
    fee: currentFee,
    intentions: [
      {
        action: "swap",
        exchange_id: EXCHANGE_ID,
        pool_utxo_spend: poolUtxos.map((utxo) => `${utxo.txid}:${utxo.vout}`),
        pool_utxo_receive: poolVouts.map((vout) => `${txid}:${vout}`),
        input_coins: [
          {
            from: paymentAddress,
            coin: {
              id: BITCOIN.id,
              value: btcAmount,
            },
          },
        ],
        output_coins: [
          {
            to: address,
            coin: {
              id: runeid,
              value: runeAmount,
            },
          },
        ],
        action_params: "",
        pool_address: poolAddress,
        nonce,
      },
    ],
  };
}
