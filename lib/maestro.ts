import axios, { AxiosInstance } from "axios";
import type {
  RawBtcUtxo,
  RawRuneUtxo,
  RawInscription,
  RawRuneInfo,
} from "@/types/utxo";

export class Maestro {
  private axios: AxiosInstance;

  constructor(params: { baseUrl: string; apiKey: string }) {
    this.axios = axios.create({
      baseURL: params.baseUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": `${params.apiKey}`,
      },
    });
  }

  async utxosByAddress(address: string, cursor?: string | null) {
    const res = await this.axios
      .get<{
        next_cursor: string | null;
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: RawBtcUtxo[];
      }>(
        `/addresses/${address}/utxos?filter_dust=true&filter_dust_threshold=547&exclude_metaprotocols=true&order=asc&count=100${cursor ? `&cursor=${cursor}` : ""}`
      )
      .then((res) => res.data);

    return res;
  }

  async inscriptionsByAddress(address: string, cursor?: string | null) {
    const response = await this.axios
      .get<{
        next_cursor: string | null;
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: RawInscription[];
      }>(
        `/addresses/${address}/inscriptions?count=100${
          cursor ? `&cursor=${cursor}` : ""
        }`
      )
      .then((res) => res.data);

    return response;
  }

  async inscriptionIdsByCollectionSymbol(
    collection: string,
    cursor?: string | null
  ) {
    const response = await this.axios
      .get<{
        next_cursor: string | null;
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: string[];
      }>(
        `/assets/collections/${collection}/inscriptions?count=100${
          cursor ? `&cursor=${cursor}` : ""
        }`
      )
      .then((res) => res.data);

    return response;
  }

  async runeUtxosByAddress(
    address: string,
    rune: string,
    cursor?: string | null
  ) {
    const response = await this.axios
      .get<{
        next_cursor: string | null;
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: RawRuneUtxo[];
      }>(
        `/addresses/${address}/runes/utxos?order_by=height&order=asc&count=100&rune=${rune}${
          cursor ? `&cursor=${cursor}` : ""
        }`
      )
      .then((res) => res.data);

    return response;
  }

  async runeInfo(rune: string) {
    const response = await this.axios
      .get<{
        next_cursor: string | null;
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: RawRuneInfo;
      }>(`/assets/runes/${rune}`)
      .then((res) => res.data);

    return response;
  }

  async latestBlock() {
    const response = await this.axios
      .get<{
        last_updated: {
          block_hash: string;
          block_height: bigint;
        };
        data: {
          height: number;
        };
      }>(`rpc/block/latest`)
      .then((res) => res.data);

    return response;
  }

  async btcPriceByTimestamp(timestamp: number) {
    try {
      const response = await this.axios
        .get<{
          price: number;
          timestamp: number;
        }>(`markets/prices/${timestamp}`)
        .then((res) => res.data);

      return response;
    } catch {
      return {
        price: 100000,
        timestamp,
      };
    }
  }

  async satoshiBalanceByAddress(address: string) {
    const response = await this.axios
      .get<{
        data: string;
      }>(`mempool/addresses/${address}/balance`)
      .then((res) => res.data);

    return response;
  }

  async runesByAddress(address: string) {
    const response = await this.axios
      .get<{
        data: Record<string, string>;
      }>(`mempool/addresses/${address}/runes`)
      .then((res) => res.data);

    return response;
  }
}
