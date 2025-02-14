import { AddressType, UnspentOutput } from "../types";
import { hexToBytes, bytesToHex } from "./utils";
import * as btc from "@scure/btc-signer";
import * as bitcoin from "bitcoinjs-lib";
import { ECPairAPI, ECPairFactory } from "ecpair";
import * as ecc from "@bitcoinerlab/secp256k1";

const ECPair: ECPairAPI = ECPairFactory(ecc);

interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo?: { value: bigint; script: Uint8Array };
    tapInternalKey?: Uint8Array;
    nonWitnessUtxo?: Uint8Array;
  };
  utxo: UnspentOutput;
}

interface TxOutput {
  address?: string;
  script?: Uint8Array;
  value: bigint;
}

function utxoToInput(utxo: UnspentOutput): TxInput {
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
    data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: hexToBytes(utxo.scriptPk),
      },
      tapInternalKey: hexToBytes(utxo.pubkey),
    };
  } else if (utxo.addressType === AddressType.P2SH_P2WPKH && utxo.pubkey) {
    const p2wpkh = btc.p2wpkh(hexToBytes(utxo.pubkey));
    const p2sh = btc.p2sh(p2wpkh);
    data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: hexToBytes(utxo.scriptPk),
      },
      redeemScript: p2sh.redeemScript,
    };
  }

  return {
    data,
    utxo,
  };
}

export class Transaction {
  private utxos: UnspentOutput[] = [];
  private inputs: TxInput[] = [];
  public outputs: TxOutput[] = [];
  public changedAddress: string = "";
  private feeRate: number = 0;
  private enableRBF = true;

  setEnableRBF(enable: boolean) {
    this.enableRBF = enable;
  }

  setFeeRate(feeRate: number) {
    this.feeRate = feeRate;
  }

  setChangeAddress(address: string) {
    this.changedAddress = address;
  }

  addInput(utxo: UnspentOutput) {
    this.utxos.push(utxo);
    this.inputs.push(utxoToInput(utxo));
  }

  removeLastInput() {
    this.utxos = this.utxos.slice(0, -1);
    this.inputs = this.inputs.slice(0, -1);
  }

  getTotalInput() {
    return this.inputs.reduce(
      (pre, cur) => pre + BigInt(cur.utxo.satoshis),
      BigInt(0)
    );
  }

  getTotalOutput() {
    return this.outputs.reduce((pre, cur) => pre + cur.value, BigInt(0));
  }

  calNetworkFee() {
    const psbt = this.createEstimatePsbt();
    const txSize = psbt.extractTransaction(true).virtualSize();
    const fee = Math.ceil(txSize * this.feeRate);
    return fee;
  }

  addOutput(address: string, value: bigint) {
    this.outputs.push({
      address,
      value,
    });
  }

  addScriptOutput(script: Uint8Array, value: bigint) {
    this.outputs.push({
      script,
      value,
    });
  }

  toPsbt() {
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    this.inputs.forEach((v, index) => {
      psbt.data.addInput(v.data);
      if (this.enableRBF) {
        psbt.setInputSequence(index, 0xfffffffd);
      }
    });

    this.outputs.forEach((v) => {
      if (v.address) {
        psbt.addOutput({
          address: v.address,
          value: v.value,
        });
      } else if (v.script) {
        psbt.addOutput({
          script: v.script,
          value: v.value,
        });
      }
    });

    return psbt;
  }

  clone() {
    const tx = new Transaction();

    tx.setFeeRate(this.feeRate);
    tx.setEnableRBF(this.enableRBF);
    tx.setChangeAddress(this.changedAddress);
    tx.utxos = this.utxos.map((v) => Object.assign({}, v));
    tx.inputs = this.inputs.map((v) => v);
    tx.outputs = this.outputs.map((v) => v);
    return tx;
  }

  createEstimatePsbt() {
    const network = bitcoin.networks.bitcoin;
    const ecpair = ECPair.makeRandom({ network });
    const keyPair = ECPair.fromWIF(ecpair.toWIF(), network);
    const pubkey = keyPair.publicKey;
    const { address } = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    const scriptPk = bitcoin.address.toOutputScript(address!, network);

    const tx = this.clone();
    tx.utxos.forEach((v) => {
      v.scriptPk = bytesToHex(scriptPk);
    });

    tx.inputs = [];
    tx.utxos.forEach((v) => {
      const input = utxoToInput(v);
      tx.inputs.push(input);
    });
    const psbt = tx.toPsbt();

    const toSignInputs = tx.inputs.map((v, index) => ({
      index,
      publicKey: pubkey,
    }));

    toSignInputs.forEach((input) => {
      psbt.signTaprootInput(input.index, keyPair);
      psbt.finalizeInput(input.index);
    });

    return psbt;
  }
}
