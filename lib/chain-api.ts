import axios from "axios";
import { getTxScript } from "./utils";
import { UnspentOutput } from "@/types";
import { COIN_LIST } from "./constants";

const ORD_SCAN_API_KEY = process.env.ORD_SCAN_API_KEY;

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

const ordScanApi = axios.create({
  baseURL: `https://api.ordiscan.com/v1`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ORD_SCAN_API_KEY}`,
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

// export async function getAddressUtxos(address: string) {
//   const data = await mempoolApi
//     .get<
//       {
//         txid: string;
//         vout: number;
//         value: number;
//         status: {
//           confirmed: boolean;
//           block_height: number;
//         };
//       }[]
//     >(`address/${address}/utxo`)
//     .then((res) => res.data ?? []);

//   const utxos = data.length
//     ? await Promise.all(
//         data.map(({ txid, vout }) => getUtxoByOutpoint(txid, vout))
//       )
//     : [];

//   return utxos
//     .filter((utxo) => !!utxo)
//     .sort((a, b) =>
//       a.status?.blockHeight && b.status?.blockHeight
//         ? a.status.blockHeight - b.status.blockHeight
//         : 0
//     );
// }

export async function getAddressUtxos(address: string) {
  const data = await ordScanApi
    .get<{
      data: {
        outpoint: string;
        value: number;
        runes: {
          name: string;
          balance: string;
        }[];
        inscriptions: string[];
      }[];
    }>(`address/${address}/utxos`)
    .then((res) => res.data.data ?? []);

  const scripts = data.length
    ? await Promise.all(data.map(({ outpoint }) => getTxScript(outpoint)))
    : [];

  const validUtxos: UnspentOutput[] = [];

  data.forEach(({ outpoint, runes, value, inscriptions }, idx) => {
    const [txid, vout] = outpoint.split(":");
    if (inscriptions.length) {
      return;
    }
    const utxo: UnspentOutput = {
      txid,
      vout: Number(vout),
      satoshis: String(value),
      scriptPk: scripts[idx].scriptPk,
      address: scripts[idx].address,
      runes: runes.map(({ name, balance }) => {
        const runeId =
          COIN_LIST.find((coin) => coin.runeId === name)?.id ?? "UNKNOWN";
        return {
          id: runeId,
          amount: balance,
        };
      }),
    };

    validUtxos.push(utxo);
  });

  return validUtxos;
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
