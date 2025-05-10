import { UnspentOutput, ToSignInput, SwapQuote, Coin, TxInput } from "@/types";

import { BITCOIN, UTXO_DUST, EXCHANGE_ID } from "@/lib/constants";

import { RuneId, Runestone, none, Edict } from "runelib";
import { getAddressType, addressTypeToString } from "@/lib/utils/address";

import { Orchestrator } from "@/lib/orchestrator";
import { AddressType } from "@/types";
import * as bitcoin from "bitcoinjs-lib";

import { utxoToInput } from "./common";
import { selectBtcUtxos } from "./common";

export async function runeSwapRuneTx({
  runeA,
  runeB,
  btcUtxos,
  runeUtxos,
  address,
  paymentAddress,
  swapQuote,
}: {
  runeA: Coin;
  runeB: Coin;
  btcUtxos: UnspentOutput[];
  runeUtxos: UnspentOutput[];
  address: string;
  paymentAddress: string;
  swapQuote: SwapQuote;
}) {
  if (!swapQuote.routes?.length) {
    return;
  }

  const route0 = swapQuote.routes[0];
  const route1 = swapQuote.routes[1];

  const pool0Address = route0.pool.address;
  const pool1Address = route1.pool.address;

  const _psbt = new bitcoin.Psbt({
    network: bitcoin.networks.testnet,
  });

  const runeAAmount = BigInt(route0.inputAmount);
  const btcAmount = BigInt(route0.outputAmount);
  const runeBAmount = BigInt(route1.outputAmount);

  const pool0Utxos = route0.poolUtxos;
  const pool1Utxos = route1.poolUtxos;

  // inputs
  const txInputs: TxInput[] = [];
  let inputUtxoDusts = BigInt(0);

  let pool0RuneAmount = BigInt(0),
    pool0BtcAmount = BigInt(0);

  let pool1RuneAmount = BigInt(0),
    pool1BtcAmount = BigInt(0);

  pool0Utxos.forEach((utxo) => {
    const rune = utxo.runes.find((rune) => rune.id === runeA.id);
    pool0RuneAmount += BigInt(rune!.amount);
    pool0BtcAmount += BigInt(utxo.satoshis);
    txInputs.push(utxoToInput(utxo));
  });
  pool1Utxos.forEach((utxo) => {
    const rune = utxo.runes.find((rune) => rune.id === runeB.id);
    pool1RuneAmount += BigInt(rune!.amount);
    pool1BtcAmount += BigInt(utxo.satoshis);
    txInputs.push(utxoToInput(utxo));
  });

  runeUtxos.forEach((v) => {
    txInputs.push(utxoToInput(v));
    inputUtxoDusts += BigInt(v.satoshis);
  });

  let fromRuneAmount = BigInt(0);
  let hasMultipleRunes = false;
  const runesMap: Record<string, boolean> = {};
  runeUtxos.forEach((v) => {
    if (v.runes) {
      v.runes.forEach((w) => {
        runesMap[w.id] = true;
        if (w.id === runeA.id) {
          fromRuneAmount = fromRuneAmount + BigInt(w.amount);
        }
      });
    }
  });

  if (Object.keys(runesMap).length > 1) {
    hasMultipleRunes = true;
  }

  const changeRuneAmount = fromRuneAmount - runeAAmount;
  const [runeABlock, runeAIdx] = runeA.id.split(":");
  const [runeBBlock, runeBIdx] = runeB.id.split(":");
  const needChange = hasMultipleRunes || changeRuneAmount > 0;

  const pool1ChangeRuneAmount = pool1RuneAmount - runeBAmount;
  const pool1NeedChange = pool1ChangeRuneAmount > 0;

  const edicts: Edict[] = [];

  const pool0Vouts: number[] = [];
  const pool1Vouts: number[] = [];

  const outputArr: ({
    runeBlock: number;
    runeIdx: number;
    runeAmount: bigint;
    address: string;
    btcAmount: bigint;
  } | null)[] = [
    // change runeA to user
    needChange
      ? {
          runeBlock: Number(runeABlock),
          runeIdx: Number(runeAIdx),
          runeAmount: changeRuneAmount,
          address,
          btcAmount: UTXO_DUST,
        }
      : null,
    // change runeB to pool1
    pool1NeedChange
      ? {
          runeBlock: Number(runeBBlock),
          runeIdx: Number(runeBIdx),
          runeAmount: pool1ChangeRuneAmount,
          address: pool1Address,
          btcAmount: pool1BtcAmount + btcAmount,
        }
      : null,
    // send runeA to pool0,
    {
      runeBlock: Number(runeABlock),
      runeIdx: Number(runeAIdx),
      runeAmount: pool0RuneAmount + runeAAmount,
      address: pool0Address,
      btcAmount: pool0BtcAmount - btcAmount,
    },
    {
      runeBlock: Number(runeBBlock),
      runeIdx: Number(runeBIdx),
      runeAmount: runeBAmount,
      address,
      btcAmount: UTXO_DUST,
    },
  ];

  outputArr
    .filter((output) => output !== null)
    .forEach(({ runeBlock, runeIdx, address, runeAmount, btcAmount }, idx) => {
      _psbt.addOutput({
        address,
        value: btcAmount,
      });
      edicts.push(new Edict(new RuneId(runeBlock, runeIdx), runeAmount, idx));
      if (address === pool0Address) {
        pool0Vouts.push(idx);
      } else if (address === pool1Address) {
        pool1Vouts.push(idx);
      }
    });

  const runestone = new Runestone(edicts, none(), none(), none());

  const opReturnScript = runestone.encipher();
  // OP_RETURN
  _psbt.addOutput({
    script: opReturnScript,
    value: BigInt(0),
  });

  let inputAddressTypes = txInputs.map(({ utxo }) =>
    addressTypeToString(getAddressType(utxo.address))
  );
  const outputAddressTypes = [
    ...outputArr
      .filter((output) => output !== null)
      .map(({ address }) => addressTypeToString(getAddressType(address))),
    { OpReturn: BigInt(opReturnScript.length) },
    addressTypeToString(getAddressType(paymentAddress)),
  ];

  let lastFee = BigInt(0);
  let currentFee = BigInt(0);
  let selectedUtxos: UnspentOutput[] = [];
  let discardedSats = BigInt(0);

  const utxoDust = (needChange ? UTXO_DUST : BigInt(0)) + UTXO_DUST;
  let leftFeeAmount = BigInt(0);

  do {
    lastFee = currentFee;

    currentFee = await Orchestrator.getEstimateMinTxFee({
      input_types: inputAddressTypes,
      pool_address: [pool0Address, pool1Address],
      output_types: outputAddressTypes,
    });

    currentFee += BigInt(1);

    leftFeeAmount = currentFee + utxoDust;

    if (currentFee > lastFee && leftFeeAmount > 0) {
      const { selectedUtxos: _selectedUtxos } = selectBtcUtxos(
        btcUtxos,
        leftFeeAmount
      );

      if (_selectedUtxos.length === 0) {
        throw new Error("INSUFFICIENT_BTC_UTXO");
      }

      inputAddressTypes = [
        ...txInputs.map(({ utxo }) =>
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

      const changeBtcAmount = totalBtcAmount - leftFeeAmount;
      if (changeBtcAmount > 0 && changeBtcAmount > UTXO_DUST) {
        outputAddressTypes.pop();
        outputAddressTypes.push(
          addressTypeToString(getAddressType(paymentAddress))
        );
      }
      selectedUtxos = _selectedUtxos;
    }
  } while (currentFee > lastFee && leftFeeAmount > 0);

  let totalBtcAmount = inputUtxoDusts - utxoDust;

  selectedUtxos.forEach((utxo) => {
    txInputs.push(utxoToInput(utxo));
    totalBtcAmount += BigInt(utxo.satoshis);
  });

  const changeBtcAmount = totalBtcAmount - currentFee;

  if (changeBtcAmount < 0) {
    throw new Error("Insufficient UTXO(s)");
  }

  if (changeBtcAmount > UTXO_DUST) {
    _psbt.addOutput({
      address: paymentAddress,
      value: changeBtcAmount,
    });
  } else if (changeBtcAmount > BigInt(0)) {
    discardedSats = changeBtcAmount;
  }

  txInputs.forEach((input) => {
    _psbt.data.addInput(input.data);
  });

  //@ts-expect-error: todo
  const unsignedTx = _psbt.__CACHE.__TX;

  const toSignInputs: ToSignInput[] = [];

  const _toSpendUtxos = txInputs
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
    const input = txInputs[toSignIndex];
    const inputAddress = input.utxo.address;
    if (!inputAddress) continue;
    const redeemScript = _psbt.data.inputs[toSignIndex].redeemScript;
    const addressType = getAddressType(inputAddress);

    if (redeemScript && addressType === AddressType.P2SH_P2WPKH) {
      const finalScriptSig = bitcoin.script.compile([redeemScript]);
      unsignedTxClone.setInputScript(toSignIndex, finalScriptSig);
    }
  }

  const txid = unsignedTxClone.getId();

  return {
    psbt: _psbt,
    toSpendUtxos: _toSpendUtxos,
    toSignInputs,
    txid,
    fee: currentFee + discardedSats,
    intentions: [
      {
        action: "swap",
        exchange_id: EXCHANGE_ID,
        pool_utxo_spend: pool0Utxos.map((utxo) => `${utxo.txid}:${utxo.vout}`),
        pool_utxo_receive: pool0Vouts.map((vout) => `${txid}:${vout}`),
        input_coins: [
          {
            from: address,
            coin: {
              id: runeA.id,
              value: runeAAmount,
            },
          },
        ],
        output_coins: [
          {
            to: pool0Address,
            coin: {
              id: BITCOIN.id,
              value: btcAmount,
            },
          },
        ],
        action_params: "",
        pool_address: pool0Address,
        nonce: BigInt(route0.nonce),
      },
      {
        action: "swap",
        exchange_id: EXCHANGE_ID,
        pool_utxo_spend: pool1Utxos.map((utxo) => `${utxo.txid}:${utxo.vout}`),
        pool_utxo_receive: pool1Vouts.map((vout) => `${txid}:${vout}`),
        input_coins: [
          {
            from: pool0Address,
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
              id: runeB.id,
              value: runeBAmount,
            },
          },
        ],
        action_params: "",
        pool_address: pool1Address,
        nonce: BigInt(route1.nonce),
      },
    ],
  };
}
