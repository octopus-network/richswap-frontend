import * as bitcoin from "bitcoinjs-lib";
import { AddressType } from "@/types";
import { NetworkType } from "./network";
import { toPsbtNetwork } from "./network";

export function addressToScriptPk(address: string, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType);
  return bitcoin.address.toOutputScript(address, network);
}

export function getEstimateAddress(
  pubkey: Uint8Array,
  addressType: AddressType,
  networkType: NetworkType
) {
  const network = toPsbtNetwork(networkType);

  const defaultAddress =
    "bc1py6wpspaygpcgzts8se00cufvrz0acf3yklxc7gx3trj0wxag8n5sm2ysdc";

  if (addressType === AddressType.P2PKH) {
    const { address } = bitcoin.payments.p2pkh({
      pubkey,
      network,
    });
    return address ?? defaultAddress;
  } else if (
    addressType === AddressType.P2SH_P2WPKH ||
    addressType === AddressType.P2WPKH
  ) {
    const { address } = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    return address ?? defaultAddress;
  } else if (addressType === AddressType.P2TR) {
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1),
      network,
    });

    return address ?? defaultAddress;
  }

  return defaultAddress;
}

export function decodeAddress(address: string) {
  const mainnet = bitcoin.networks.bitcoin;
  const testnet = bitcoin.networks.testnet;
  const regtest = bitcoin.networks.regtest;
  let decodeBase58: bitcoin.address.Base58CheckResult;
  let decodeBech32: bitcoin.address.Bech32Result;
  let networkType: NetworkType;
  let addressType: AddressType;
  if (
    address.startsWith("bc1") ||
    address.startsWith("tb1") ||
    address.startsWith("bcrt1")
  ) {
    try {
      decodeBech32 = bitcoin.address.fromBech32(address);
      if (decodeBech32.prefix === mainnet.bech32) {
        networkType = NetworkType.MAINNET;
      } else if (decodeBech32.prefix === testnet.bech32) {
        networkType = NetworkType.TESTNET;
      } else {
        networkType = NetworkType.REGTEST;
      }
      if (decodeBech32.version === 0) {
        if (decodeBech32.data.length === 20) {
          addressType = AddressType.P2WPKH;
        } else {
          addressType = AddressType.P2WSH;
        }
      } else {
        addressType = AddressType.P2TR;
      }
      return {
        networkType,
        addressType,
      };
    } catch {}
  } else {
    try {
      decodeBase58 = bitcoin.address.fromBase58Check(address);
      if (decodeBase58.version === mainnet.pubKeyHash) {
        networkType = NetworkType.MAINNET;
        addressType = AddressType.P2PKH;
      } else if (decodeBase58.version === testnet.pubKeyHash) {
        networkType = NetworkType.TESTNET;
        addressType = AddressType.P2PKH;
      } else if (decodeBase58.version === regtest.pubKeyHash) {
        // do not work
        networkType = NetworkType.REGTEST;
        addressType = AddressType.P2PKH;
      } else if (decodeBase58.version === mainnet.scriptHash) {
        networkType = NetworkType.MAINNET;
        addressType = AddressType.P2SH_P2WPKH;
      } else if (decodeBase58.version === testnet.scriptHash) {
        networkType = NetworkType.TESTNET;
        addressType = AddressType.P2SH_P2WPKH;
      } else {
        // do not work
        networkType = NetworkType.REGTEST;
        addressType = AddressType.P2SH_P2WPKH;
      }
      return {
        networkType,
        addressType,
      };
    } catch {}
  }

  return {
    networkType: NetworkType.MAINNET,
    addressType: AddressType.UNKNOWN,
    dust: 546,
  };
}

export function getAddressType(address: string): AddressType {
  return decodeAddress(address).addressType;
}
