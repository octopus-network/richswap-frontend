import { Coin, UnspentOutput } from "@/types";
import { BITCOIN } from "../constants";
import { Edict, Runestone } from "runelib";

import { getRawTx, getTxInfo } from "@/lib/chain-api";

export async function getUtxoByOutpoint(
  txid: string,
  vout: number
): Promise<UnspentOutput | undefined> {
  const voutNumber = Number(vout);

  const [{ vout: outputs, status }, rawTx] = (await Promise.all([
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
    rune: edict
      ? {
          id: `${edict.id.block}:${edict.id.idx}`,
          amount: edict.amount.toString(),
        }
      : undefined,
    status: {
      confirmed: status?.confirmed ?? false,
      blockHeight: status?.block_height ?? 0,
    },
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
    const runeA = a.rune;
    const runeB = b.rune;
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
      if (utxo.rune) {
        continue;
      }
      if (totalAmount < targetAmount) {
        totalAmount += BigInt(utxo.satoshis);
        selectedUtxos.push(utxo);
      }
    } else {
      if (!utxo.rune) {
        continue;
      }
      const containsTargetCoinUtxo = utxo.rune?.id === coin.id;

      if (!containsTargetCoinUtxo) {
        continue;
      }

      if (totalAmount < targetAmount) {
        totalAmount += BigInt(utxo.rune.amount);
        selectedUtxos.push({
          ...utxo,
          rune: utxo.rune,
        });
      } else {
        break;
      }
    }
  }

  return selectedUtxos;
}
