import { Coin } from "@/types";

export const BITCOIN: Coin = {
  id: "0:0",
  symbol: "BTC",
  icon: "/static/icons/btc.png",
  name: "Bitcoin",
  decimals: 8,
};

export const UNKNOWN_COIN: Coin = {
  id: "UNKNOWN",
  symbol: "UNKNOWN",
  name: "UNKNOWN",
  decimals: 8,
};

export const COIN_LIST: Coin[] = [BITCOIN];
