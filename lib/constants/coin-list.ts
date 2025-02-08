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

export const COIN_LIST: Coin[] = [
  BITCOIN,
  {
    id: "840000:846",
    symbol: "RICH",
    icon: "/static/icons/rich.png",
    name: "HOPE•YOU•GET•RICH",
    runeId: "HOPEYOUGETRICH",
    decimals: 2,
  },
];
