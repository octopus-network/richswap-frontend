import { actor } from "./actor";
import {
  Coin,
  SwapQuote,
  SwapState,
  DepositState,
  DepositQuote,
  UnspentOutput,
  PoolInfo,
} from "@/types";
import { BITCOIN } from "../constants";
import {
  getP2trAressAndScript,
  formatCoinAmount,
  fetchCoinById,
} from "../utils";
import Decimal from "decimal.js";

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
      const res = (await actor.list_pools([], 20)) as {
        id: string;
        name: string;
      }[];

      if (res?.length) {
        const promises = res.map(({ id }) => this.getPoolInfo(id));

        const poolInfos = await Promise.all(promises);

        const poolList = [];

        for (let i = 0; i < poolInfos.length; i++) {
          const info = poolInfos[i];
          const { name } = res[i];
          if (info) {
            poolList.push({ ...info, name });
          }
        }

        return poolList;
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
          coinAAmount: (utxo[0]?.satoshis ?? BigInt(0)).toString(),
          coinBAmount: utxo[0]?.balance.value.toString() ?? "0",
        };
      }
    } catch (error) {
      console.log(error);
    }

    return undefined;
  }

  public static async getPosition(pool: PoolInfo, userAddress: string) {
    try {
      const res = await actor
        .get_lp(pool.key, userAddress)
        .then((data: any) => {
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const { btc_supply, sqrt_k, user_share } = res as {
        btc_supply: bigint;
        sqrt_k: bigint;
        user_share: bigint;
      };

      if (!Number(user_share) || !Number(btc_supply)) {
        return null;
      }

      const userSharePercentageDecimal = new Decimal(user_share.toString()).div(
        sqrt_k.toString()
      );

      const coinAAmount = formatCoinAmount(
        userSharePercentageDecimal.mul(pool.coinAAmount).toFixed(0),
        pool.coinA
      );
      const coinBAmount = formatCoinAmount(
        userSharePercentageDecimal.mul(pool.coinBAmount).toFixed(0),
        pool.coinB
      );

      return {
        poolKey: pool.key,
        coinA: pool.coinA,
        coinB: pool.coinB,
        userAddress,
        userShare: user_share.toString(),
        coinAAmount,
        coinBAmount,
        btcSupply: btc_supply.toString(),
        sqrtK: sqrt_k.toString(),
      };
    } catch {
      return null;
    }
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

  public static async preWithdrawLiquidity(
    poolKey: string,
    userAddress: string,
    coinBalance: {
      id: string;
      value: bigint;
    }
  ): Promise<{
    utxos: UnspentOutput[];
    nonce: string;
    output: {
      coinA: Coin;
      coinB: Coin;
      coinAAmount: string;
      coinBAmount: string;
    };
  } | null> {
    try {
      const res = await actor
        .pre_withdraw_liquidity(poolKey, userAddress, coinBalance)
        .then((data: any) => {
          if (data.Ok) {
            return data.Ok as {
              input: {
                balance: {
                  id: string;
                  value: bigint;
                };
                satoshis: bigint;
                txid: string;
                vout: number;
              };
              nonce: bigint;
              user_outputs: [
                {
                  id: string;
                  value: bigint;
                },
                {
                  id: string;
                  value: bigint;
                }
              ];
            };
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const coinA = BITCOIN;
      const [_coinA, _coinB] = res.user_outputs;

      const coinB = await fetchCoinById(_coinB.id);

      const { address, output } = getP2trAressAndScript(poolKey);

      const utxo: UnspentOutput = {
        txid: res.input.txid,
        vout: res.input.vout,
        satoshis: res.input.satoshis.toString(),
        address: address!,
        scriptPk: output,
        runes: [
          {
            id: res.input.balance.id,
            amount: res.input.balance.value.toString(),
          },
        ],
      };

      return {
        utxos: [utxo],
        nonce: res.nonce.toString(),
        output: {
          coinA,
          coinB,
          coinAAmount: formatCoinAmount(_coinA.value.toString(), coinA),
          coinBAmount: formatCoinAmount(_coinB.value.toString(), coinB),
        },
      };
    } catch (err: any) {
      console.log("pre_withdraw error", err);
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
