import axios, { AxiosInstance, AxiosResponse } from "axios";

class RequestError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public response?: AxiosResponse
  ) {
    super((response && response.config ? response.config.url : "") + message);
  }

  isApiException = true;
}

export class OpenApi {
  private axios: AxiosInstance;

  constructor(params: { baseUrl: string; apiKey: string }) {
    this.axios = axios.create({
      baseURL: params.baseUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
    });

    this.axios.interceptors.response.use(
      (async (
        response: AxiosResponse<{
          code: number;
          msg: string;
          data: any;
        }>
      ) => {
        const res = response.data;
        if (res.code != 0) {
          throw new RequestError(res.msg);
        }
        return res.data;
      }) as any,
      (error) => {
        if (error.response) {
          return Promise.reject(
            new RequestError(
              error.response.data,
              error.response.status,
              error.response
            )
          );
        }

        if (error.isAxiosError) {
          return Promise.reject(new RequestError("noInternetConnection"));
        }
        return Promise.reject(error);
      }
    );
  }

  async getAddressUtxoData(address: string, cursor = 0, size = 100) {
    const response = await this.axios.get<
      null,
      {
        cursor: number;
        total: number;
        totalConfirmed: number;
        totalUnconfirmed: number;
        totalUnconfirmedSpend: number;
        utxo: {
          height: number;
          inscriptions: any[];
          txid: string;
          vout: number;
          satoshi: number;
          scriptPk: string;
        }[];
      }
    >(`/v1/indexer/address/${address}/utxo-data?cursor=${cursor}&size=${size}`);
    return response;
  }

  async getAddressRunesBalanceList(address: string) {
    const response = await this.axios.get<
      null,
      {
        detail: {
          amount: string;
          runeid: string;
          rune: string;
          spacedRune: string;
          symbol: string;
          divisibility: number;
        }[];
      }
    >(`/v1/indexer/address/${address}/runes/balance-list`);
    return response;
  }

  async getAddressRunesUtxo(address: string, runeid: string) {
    const response = await this.axios.get<
      null,
      {
        start: number;
        total: number;
        utxo: {
          address: string;
          satoshi: number;
          scriptPk: string;
          txid: string;
          vout: 0;
          runes: { runeid: string; amount: string }[];
        }[];
      }
    >(`/v1/indexer/address/${address}/runes/${runeid}/utxo`);

    return response;
  }
}
