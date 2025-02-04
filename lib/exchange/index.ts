import { actor } from "./actor";
import {
  Coin,
  SwapQuote,
  SwapState,
  DepositState,
  DepositQuote,
  UnspentOutput,
} from "@/types";
import { BITCOIN, UTXO_DUST, COIN_LIST } from "../constants";
import { getP2trAressAndScript, formatCoinAmount } from "../utils";

export class Exchange {
  public static async getPoolKey(inputCoinId: string, outputCoinId: string) {
    const poolList = await this.getPoolList();

    const runeId = inputCoinId === BITCOIN.id ? outputCoinId : inputCoinId;

    const poolKey = poolList?.find((p) => p.coinBId === runeId)?.key;

    return poolKey;
  }

  public static async getPoolList(): Promise<
    {
      key: string;
      coinAId: string;
      coinBId: string;
      coinAAmount: string;
      name: string;
      coinBAmount: string;
    }[]
  > {
    try {
      const res = (await actor.list_pools()) as {
        id: string;
        name: string;
      }[];

      if (res?.length) {
        const promises = res.map(({ id }) => this.getPoolInfo(id));

        const poolInfos = await Promise.all(promises);

        const filteredInfos = poolInfos.filter((info) => !!info);

        return filteredInfos.map((info, idx) => {
          const { name } = res[idx];

          return {
            ...info,
            name,
          };
        });
      }
    } catch (error) {
      console.log(error);
    }
    return [];
  }

  public static async createPool(coinId: string) {
    const poolKey = await actor.create(coinId).then((data: any) => {
      if (data.Ok) {
        return data.Ok;
      } else {
        throw new Error(data.Err ? Object.keys(data.Err)[0] : "Unknown Error");
      }
    });
    return poolKey;
  }

  public static async getPoolInfo(poolKey: string): Promise<
    | {
        key: string;
        coinAId: string;
        coinBId: string;
        coinAAmount: string;
        coinBAmount: string;
      }
    | undefined
  > {
    try {
      const res: any = await actor.find_pool(poolKey);

      if (res?.length) {
        const data = res[0];
        const meta = data.meta;
        const state = data.state[0];
        const { utxo } = state;

        return {
          key: poolKey,
          coinAId: BITCOIN.id,
          coinBId: meta.id,
          coinAAmount: (utxo[0]?.satoshis ?? BigInt(0) - UTXO_DUST).toString(),
          coinBAmount: utxo[0]?.balance.value.toString() ?? "0",
        };
      }
    } catch (error) {
      console.log(error);
    }

    return undefined;
  }

  public static async preAddLiquidity(
    poolKey: string,
    coin: Coin,
    coinAmount: string
  ): Promise<DepositQuote | undefined> {
    try {
      const { output, inputs, nonce } = await actor
        .pre_add_liquidity(poolKey, { id: coin.id, value: BigInt(coinAmount) })
        .then((data: any) => {
          console.log(coin, coinAmount, data);
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const utxos: UnspentOutput[] = [];

      inputs.forEach(async ({ txid, vout, satoshis, balance }: any) => {
        const { address, output } = getP2trAressAndScript(poolKey);

        const tmpObj: UnspentOutput = {
          txid,
          vout,
          satoshis: satoshis.toString(),
          address: address!,
          scriptPk: output,
          runes: [],
        };
        if (balance.id !== BITCOIN.id) {
          tmpObj.runes = [
            {
              id: balance.id,
              amount: balance.value.toString(),
            },
          ];
        }
        utxos.push(tmpObj);
      });

      const quote = {
        state: DepositState.VALID,
        inputAmount: coinAmount,
        outputAmount: output.value.toString(),
        utxos,
        nonce: nonce.toString(),
      };

      return quote;
    } catch (error: any) {
      return {
        state: DepositState.INVALID,
        inputAmount: coinAmount,
        errorMessage: error instanceof Error ? error.message : "Unknown Error",
      };
    }
  }

  public static async preWithdrawLiquidity(poolKey: string, userKey: string) {
    try {
      const res = await actor
        .pre_withdraw_liquidity(poolKey, userKey)
        .then((data: any) => {
          console.log("pre_withdraw_liquidity", data);
          if (data.Ok) {
            const { user_outputs, nonce, input } = data.Ok;
            if (user_outputs?.length) {
              const [_coinA, _coinB] = data.Ok.user_outputs;
              const coinA = COIN_LIST.find((coin) => coin.id === _coinA.id);
              const coinB = COIN_LIST.find((coin) => coin.id === _coinB.id);
              if (!coinA || !coinB) {
                throw new Error("Unknown coin");
              }
              const coinAAmount = formatCoinAmount(
                (
                  _coinA.value -
                  (_coinA.id === BITCOIN.id ? UTXO_DUST : BigInt(0))
                ).toString(),
                coinA
              );

              const coinBAmount = formatCoinAmount(
                (
                  _coinB.value -
                  (_coinB.id === BITCOIN.id ? UTXO_DUST : BigInt(0))
                ).toString(),
                coinB
              );

              const { address, output } = getP2trAressAndScript(poolKey);

              const utxo: UnspentOutput = {
                txid: input.txid,
                vout: input.vout,
                satoshis: input.satoshis.toString(),
                address: address!,
                scriptPk: output,
                runes: [
                  {
                    id: input.balance.id,
                    amount: input.balance.value.toString(),
                  },
                ],
              };

              return {
                poolKey,
                coinA,
                coinAAmount,
                coinB,
                coinBAmount,
                nonce: nonce.toString(),
                utxos: [utxo],
              };
            } else {
              throw new Error("No Outputs");
            }
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      return res;
    } catch (err: any) {
      console.log("prewidthdraw error", err);
      return null;
    }
  }

  public static async preSwap(
    inputCoin: Coin | null,
    outputCoin: Coin | null,
    inputAmount: string
  ): Promise<SwapQuote | undefined> {
    if (
      !inputCoin ||
      !outputCoin ||
      !inputAmount ||
      Number(inputAmount) === 0
    ) {
      return undefined;
    }

    const poolKey = await Exchange.getPoolKey(inputCoin.id, outputCoin.id);
    if (!poolKey) {
      return {
        state: SwapState.NO_POOL,
        inputAmount,
      };
    }

    try {
      const { output, input, nonce } = await actor
        .pre_swap(poolKey, {
          id: inputCoin.id,
          value: BigInt(inputAmount),
        })
        .then((data: any) => {
          console.log("preswap", data);
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const { txid, vout, satoshis, balance } = input;

      const { output: outputScript, address } = getP2trAressAndScript(poolKey);

      const utxo: UnspentOutput = {
        txid,
        vout,
        satoshis: satoshis.toString(),
        address: address!,
        scriptPk: outputScript,
        runes: [
          {
            id: balance.id,
            amount: balance.value.toString(),
          },
        ],
      };

      const quote = {
        state: SwapState.VALID,
        poolKey,
        inputAmount,
        outputAmount: output.value.toString(),
        utxos: [utxo],
        nonce: nonce.toString(),
      };

      return quote;
    } catch (error) {
      return {
        state: SwapState.INVALID,
        inputAmount,
        errorMessage: error instanceof Error ? error.message : "Unknown Error",
      };
    }
  }
}
