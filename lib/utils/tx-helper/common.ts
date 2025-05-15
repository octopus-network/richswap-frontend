import { Coin, TransactionInfo, UnspentOutput, TransactionType } from "@/types";

import { getCoinSymbol } from "../common";
import { Runestone, Edict } from "runelib";
import { AddressType, TxInput } from "@/types";
import { getTxInfo, getRawTx } from "@/lib/chain-api";
import { getAddressType } from "../address";
import { formatNumber } from "../format-number";
import { toPsbtNetwork } from "../network";
import { hexToBytes } from "../common";
import { NETWORK } from "@/lib/constants";
import * as bitcoin from "bitcoinjs-lib";

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
    pubkey: "",
    addressType: getAddressType(scriptpubkey_address),
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

export function selectBtcUtxos(utxos: UnspentOutput[], targetAmount: bigint) {
  const selectedUtxos: UnspentOutput[] = [];
  const remainingUtxos: UnspentOutput[] = [];

  let totalAmount = BigInt(0);
  for (const utxo of utxos) {
    if (utxo.runes.length) {
      continue;
    }
    if (totalAmount < targetAmount) {
      totalAmount += BigInt(utxo.satoshis);
      selectedUtxos.push(utxo);
    } else {
      remainingUtxos.push(utxo);
    }
  }

  return {
    selectedUtxos,
    remainingUtxos,
  };
}

export function selectRuneUtxos(
  utxos: UnspentOutput[],
  coin: Coin,
  targetAmount: bigint
) {
  const selectedUtxos: UnspentOutput[] = [];
  const remainingUtxos: UnspentOutput[] = [];

  let totalAmount = BigInt(0);
  for (const utxo of utxos) {
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
      remainingUtxos.push(utxo);
    }
  }

  return {
    selectedUtxos,
    remainingUtxos,
  };
}

export function getAddedVirtualSize(addressType: AddressType) {
  if (
    addressType === AddressType.P2WPKH ||
    addressType === AddressType.M44_P2WPKH
  ) {
    return 41 + (1 + 1 + 72 + 1 + 33) / 4;
  } else if (
    addressType === AddressType.P2TR ||
    addressType === AddressType.M44_P2TR
  ) {
    return 41 + (1 + 1 + 64) / 4;
  } else if (addressType === AddressType.P2PKH) {
    return 41 + 1 + 1 + 72 + 1 + 33;
  } else if (addressType === AddressType.P2SH_P2WPKH) {
    return 41 + 24 + (1 + 1 + 72 + 1 + 33) / 4;
  }
  throw new Error("unknown address type");
}

export function getTxTitleAndDescription(transaction: TransactionInfo) {
  const { type, coinA, coinB, coinAAmount, coinBAmount } = transaction;
  let title = {
      key: "",
      data: {},
    },
    description = {
      key: "",
      data: {},
    };
  if (type === TransactionType.ADD_LIQUIDITY) {
    title = {
      key: "addLiquidityTitle",
      data: {
        poolName: getCoinSymbol(coinB),
      },
    };
    description = {
      key: "addLiquidityDescription",
      data: {
        coinA: getCoinSymbol(coinA),
        coinB: getCoinSymbol(coinB),
        amountA: formatNumber(coinAAmount),
        amountB: formatNumber(coinBAmount),
        poolName: getCoinSymbol(coinB),
      },
    };
  } else if (type === TransactionType.SWAP) {
    title = {
      key: "swapTitle",
      data: {
        coinA: getCoinSymbol(coinA),
        coinB: getCoinSymbol(coinB),
      },
    };
    description = {
      key: "swapDescription",
      data: {
        coinA: getCoinSymbol(coinA),
        coinB: getCoinSymbol(coinB),
        amountA: formatNumber(coinAAmount),
        amountB: formatNumber(coinBAmount),
      },
    };
  } else if (type === TransactionType.WITHDRAW_LIQUIDITY) {
    title = {
      key: "withdrawLiquidityTitle",
      data: {
        poolName: getCoinSymbol(coinB),
      },
    };
    description = {
      key: "withdrawLiquidityDescription",
      data: {
        coinA: getCoinSymbol(coinA),
        coinB: getCoinSymbol(coinB),
        amountA: formatNumber(coinAAmount),
        amountB: formatNumber(coinBAmount),
        poolName: getCoinSymbol(coinB),
      },
    };
  }

  return {
    title,
    description,
  };
}

export function utxoToInput(utxo: UnspentOutput, estimate?: boolean): TxInput {
  let data: any = {
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      value: BigInt(utxo.satoshis),
      script: hexToBytes(utxo.scriptPk),
    },
  };
  if (
    (utxo.addressType === AddressType.P2TR ||
      utxo.addressType === AddressType.M44_P2TR) &&
    utxo.pubkey
  ) {
    const pubkey =
      utxo.pubkey.length === 66 ? utxo.pubkey.slice(2) : utxo.pubkey;
    data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: hexToBytes(utxo.scriptPk),
      },
      tapInternalKey: hexToBytes(pubkey),
    };
  } else if (utxo.addressType === AddressType.P2PKH) {
    if (!utxo.rawtx || estimate) {
      const data = {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          value: BigInt(utxo.satoshis),
          script: hexToBytes(utxo.scriptPk),
        },
      };
      return {
        data,
        utxo,
      };
    }
  } else if (utxo.addressType === AddressType.P2SH_P2WPKH && utxo.pubkey) {
    const redeemData = bitcoin.payments.p2wpkh({
      pubkey: hexToBytes(utxo.pubkey),
      network: toPsbtNetwork(NETWORK),
    });

    data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: hexToBytes(utxo.scriptPk),
      },
      redeemScript: redeemData.output,
    };
  }

  return {
    data,
    utxo,
  };
}
