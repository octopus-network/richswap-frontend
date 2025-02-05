import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as bitcoin from "bitcoinjs-lib";
import { BITCOIN } from "../constants";
import * as ecc from "@bitcoinerlab/secp256k1";
import { Coin } from "@/types";

bitcoin.initEccLib(ecc);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ellipseMiddle(
  target: string | null,
  charsStart = 5,
  charsEnd = 5
): string {
  if (!target) {
    return "";
  }
  return `${target.slice(0, charsStart)}...${target.slice(
    target.length - charsEnd
  )}`;
}

export function bytesToHex(bytes: Uint8Array) {
  const hexes = Array.from({ length: 256 }, (_, i) =>
    i.toString(16).padStart(2, "0")
  );
  // pre-caching improves the speed 6x
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}

export function hexToBytes(hex: string) {
  const cleanHex = hex.replace(/^0x/, "").replace(/\s/g, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${cleanHex.length}`);
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(cleanHex.substr(i * 2, 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex string at position ${i * 2}`);
    }
    bytes[i] = byte;
  }
  return bytes;
}

export function getP2trAressAndScript(pubkey: string) {
  const { address, output } = bitcoin.payments.p2tr({
    internalPubkey: hexToBytes(pubkey),
  });

  return { address, output: output ? bytesToHex(output) : "" };
}

export function getCoinSymbol(coin: Coin | null) {
  return coin ? (coin.id === BITCOIN.id ? coin.symbol! : coin.name) : "";
}

export function getCoinName(coin: Coin | null) {
  return coin ? (coin.id === BITCOIN.id ? coin.name : coin.id) : "";
}
