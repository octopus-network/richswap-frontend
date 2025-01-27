import axios from "axios";
import { getUtxoByOutpoint } from "./utils";

const unisatApi = axios.create({
  baseURL: `https://wallet-api.unisat.io/v5`,
  headers: {
    "Content-Type": "application/json",
    "X-Client": "UniSat Wallet",
    "X-Version": "1.4.9",
  },
});

const unisatQueryApi = axios.create({
  baseURL: `https://api.unisat.space/query-v4`,
  headers: {
    "Content-Type": "application/json",
  },
});

const mempoolApi = axios.create({
  baseURL: `https://mempool.space/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getRuneList(address: string) {
  const runeList = await unisatApi
    .get<{
      data: {
        list: {
          divisibility: number;
          amount: string;
          rune: string;
          runeid: string;
        }[];
      };
    }>(`/runes/list?address=${address}&cursor=0&size=500`)
    .then((res) => res.data?.data?.list || []);

  return runeList;
}

export async function getAddressBalance(address: string) {
  const btcAmount = await unisatApi
    .get<{
      data: {
        confirm_amount: string;
        amount: string;
      };
    }>(`/address/balance?address=${address}`)
    .then((res) => res.data?.data?.amount || "0");

  return Number(btcAmount);
}

export async function getAddressUtxos(address: string) {
  const data = await mempoolApi
    .get<
      {
        txid: string;
        vout: number;
        value: number;
        status: {
          confirmed: boolean;
          block_height: number;
        };
      }[]
    >(`address/${address}/utxo`)
    .then((res) => res.data ?? []);

  const utxos = data.length
    ? await Promise.all(
        data.map(({ txid, vout }) => getUtxoByOutpoint(txid, vout))
      )
    : [];

  return utxos
    .filter((utxo) => !!utxo)
    .sort((a, b) =>
      a.status?.blockHeight && b.status?.blockHeight
        ? a.status.blockHeight - b.status.blockHeight
        : 0
    );
}

export async function getBtcPrice() {
  const { price } = await unisatApi
    .get<{
      data: {
        price: number;
        updateTime: number;
      };
    }>(`/default/btc-price`)
    .then((res) => res.data?.data || {});

  return price || 0;
}

export async function getFeeSummary() {
  const data = await unisatApi
    .get<{
      data: {
        list: {
          title: string;
          desc: string;
          feeRate: number;
        }[];
      };
    }>(`/default/fee-summary`)
    .then((res) => res.data?.data.list || []);

  return data;
}

export async function getLatestBlockHeight() {
  const data = await axios
    .get("https://blockchain.info/q/getblockcount")
    .then((res) => res.data);

  return data;
}

export async function getTxInfo(txid: string) {
  const data = await mempoolApi
    .get(`tx/${txid}`)
    .then((res) => res.data)
    .catch(() => ({}));

  return data;
}

export async function getRawTx(txid: string) {
  const data = await mempoolApi
    .get(`tx/${txid}/hex`)
    .then((res) => res.data)
    .catch(() => "");

  return data;
}

export async function queryRunes(rune: string) {
  const runeList = await unisatQueryApi
    .get<{
      data: {
        detail: {
          runeid: string;
          divisibility: number;
          symbol: string;
          rune: string;
          spacedRune: string;
        }[];
      };
    }>(
      `/runes/info-list?rune=${rune}&start=0&limit=10&complete=&sort=oneDayMints`
    )
    .then((res) => res.data?.data?.detail || []);

  return runeList;
}
