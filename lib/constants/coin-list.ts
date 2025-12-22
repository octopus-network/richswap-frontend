import { Coin } from "@/types";
import { NETWORK } from "./common";

export const BITCOIN: Coin = {
  id: "0:0",
  symbol: "BTC",
  icon: "/static/icons/btc.png",
  name: "Bitcoin",
  decimals: 8,
};

export const RICH: Coin = {
  id: "840000:846",
  name: "HOPE•YOU•GET•RICH",
  runeId: "HOPEYOUGETRICH",
  runeSymbol: "🧧",
  decimals: 2,
  etching: "d66de939cb3ddb4d94f0949612e06e7a84d4d0be381d0220e2903aad68135969",
};

export const ZZZZZZZ: Coin = {
  id: "927500:732",
  name: "ZZZZZZZ",
  runeId: "ZZZZZZZ",
  runeSymbol: "7Z",
  decimals: 3,
  etching: "1290e762d5f8a8a9830df1a57ba742b51ba55e122f3f24a75a4d7c6bdea67f80",
};

export const UNKNOWN_COIN: Coin = {
  id: "UNKNOWN",
  symbol: "UNKNOWN",
  name: "UNKNOWN",
  decimals: 8,
};

export const COIN_LIST: Coin[] =
  NETWORK === "mainnet" ? [BITCOIN, RICH, ZZZZZZZ] : [BITCOIN];
