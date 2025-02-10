import { Coin, UnspentOutput } from "@/types";
import { BITCOIN } from "../constants";
import { Runestone, Edict } from "runelib";

import { getTxInfo, getRawTx } from "@/lib/chain-api";

export async function getTxScript(outpoint: string) {
  const [txid, vout] = outpoint.split(":");
  const voutNumber = Number(vout);
  const { vout: outputs } = await getTxInfo(txid);

  const { scriptpubkey, scriptpubkey_address } = outputs[voutNumber];
  return {
    scriptPk: scriptpubkey,
    address: scriptpubkey_address,
  };
}

export async function getUtxoByOutpoint(
  txid: string,
  vout: number
): Promise<UnspentOutput | undefined> {
  const voutNumber = Number(vout);

  const [{ vout: outputs }, rawTx] = (await Promise.all([
    getTxInfo(txid),
    getRawTx(txid),
  ])) as [
    {
      vout: {
        scriptpubkey: string;
        scriptpubkey_address: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        value: number;
      }[];
      status: { confirmed: boolean; block_height: number };
    },
    string
  ];

  if (!outputs) {
    return;
  }

  const { scriptpubkey, scriptpubkey_address, value } = outputs[voutNumber];

  const opReturn = outputs.find(
    ({ scriptpubkey_type }) => scriptpubkey_type === "op_return"
  );

  let edicts: Edict[] = [];
  if (opReturn) {
    const stone = Runestone.decipher(rawTx);

    if (stone.isSome()) {
      const value = stone.value();
      edicts = value?.edicts || [];
    }
  }

  const edict = edicts.find((e) => e.output === voutNumber);

  return {
    txid,
    vout: voutNumber,
    satoshis: value.toString(),
    scriptPk: scriptpubkey,
    address: scriptpubkey_address,
    runes: edict
      ? [
          {
            id: `${edict.id.block}:${edict.id.idx}`,
            amount: edict.amount.toString(),
          },
        ]
      : [],
  };
}

export function selectUtxos(
  utxos: UnspentOutput[] | undefined,
  coin: Coin,
  targetAmount: bigint
) {
  if (!utxos?.length) {
    return [];
  }

  const selectedUtxos: UnspentOutput[] = [];

  let totalAmount = BigInt(0);

  const sortedUtxos = utxos.sort((a, b) => {
    const runeA = a.runes.find((rune) => rune.id === coin.id);
    const runeB = b.runes.find((rune) => rune.id === coin.id);
    const amountA =
      BITCOIN.id === coin.id
        ? BigInt(a.satoshis)
        : runeA
        ? BigInt(runeA.amount)
        : BigInt(0);
    const amountB =
      BITCOIN.id === coin.id
        ? BigInt(a.satoshis)
        : runeB
        ? BigInt(runeB.amount)
        : BigInt(0);

    return Number(amountB - amountA);
  });

  for (let i = 0; i < sortedUtxos.length; i++) {
    const utxo = sortedUtxos[i];
    if (coin === BITCOIN) {
      if (utxo.runes.length) {
        continue;
      }
      if (totalAmount < targetAmount) {
        totalAmount += BigInt(utxo.satoshis);
        selectedUtxos.push(utxo);
      }
    } else {
      if (!utxo.runes.length) {
        continue;
      }
      const containsTargetCoinUtxoIdx = utxo.runes.findIndex(
        (rune) => rune.id === coin.id
      );

      if (containsTargetCoinUtxoIdx < 0) {
        continue;
      }

      if (totalAmount < targetAmount) {
        totalAmount += BigInt(utxo.runes[containsTargetCoinUtxoIdx].amount);
        if (
          selectedUtxos.findIndex(
            (item) => item.txid === utxo.txid && item.vout === utxo.vout
          ) < 0
        ) {
          selectedUtxos.push(utxo);
        }
      } else {
        break;
      }
    }
  }

  return selectedUtxos;
}
