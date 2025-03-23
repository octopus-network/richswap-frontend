import { actor } from "./actor";
import {
  Coin,
  SwapQuote,
  SwapState,
  DepositState,
  DepositQuote,
  UnspentOutput,
  PoolInfo,
  AddressType,
  PoolData,
  PoolOverview,
} from "@/types";

import { BITCOIN } from "../constants";
import {
  getP2trAressAndScript,
  formatCoinAmount,
  fetchCoinById,
} from "../utils";
import Decimal from "decimal.js";

export class Exchange {
  public static async getPool(inputCoin: Coin, outputCoin: Coin) {
    if (inputCoin.id !== BITCOIN.id && outputCoin.id !== BITCOIN.id) {
      return undefined;
    }
    const poolList = await this.getPoolList();

    const runeId = inputCoin.id === BITCOIN.id ? outputCoin.id : inputCoin.id;

    const pool = poolList?.find((p) => p.coin_reserved[0].id === runeId);

    return pool;
  }

  public static async getPoolList(): Promise<PoolOverview[]> {
    const res = (await actor.get_pool_list({
      from: [],
      limit: 20,
    })) as PoolOverview[];

    return res;
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

  public static async getPoolData(
    address: string
  ): Promise<PoolData | undefined> {
    const res = (await actor.get_pool_info({
      pool_address: address,
    })) as [
      {
        address: string;
        attributes: string;
        btc_reserved: bigint;
        coin_reserved: [{ id: string; value: bigint }];
        key: string;
        name: string;
        nonce: bigint;
        utxos: [
          {
            sats: bigint;
            txid: string;
            vout: number;
            maybe_rune: [{ id: string; value: bigint }];
          }
        ];
      }
    ];

    if (res?.length) {
      const data = res[0];

      const attributes = JSON.parse(data.attributes);

      const coinReserved = data.coin_reserved[0];

      const utxo = data.utxos[0];

      const incomes = BigInt(0);

      return {
        key: data.key,
        coinAId: BITCOIN.id,
        coinBId: coinReserved?.id,
        coinAAmount: ((utxo?.sats ?? BigInt(0)) - incomes).toString(),
        coinBAmount: utxo?.maybe_rune[0].value.toString(),
        incomes: attributes.incomes.toString(),
      };
    }
  }

  // #TESTNET
  // public static async getPosition(pool: PoolInfo, userAddress: string) {
  //   try {
  //     const [res, poolData] = await Promise.all([
  //       actor.get_lp(pool.key, userAddress).then((data: any) => {
  //         if (data.Ok) {
  //           return data.Ok;
  //         } else {
  //           throw new Error(
  //             data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
  //           );
  //         }
  //       }),
  //       Exchange.getPoolData(pool.address),
  //     ]);

  //     console.log("position res", res);
  //     if (!poolData) {
  //       return null;
  //     }

  //     const { total_share, user_incomes, user_share } = res as {
  //       total_share: bigint;
  //       user_incomes: bigint;
  //       user_share: bigint;
  //     };

  //     if (!Number(user_share) || !Number(total_share)) {
  //       return null;
  //     }

  //     const userSharePercentageDecimal = new Decimal(user_share.toString());

  //     const coinAAmount = formatCoinAmount(
  //       userSharePercentageDecimal
  //         .mul(poolData.coinAAmount)
  //         .div(total_share.toString())
  //         .toFixed(0),
  //       pool.coinA
  //     );
  //     const coinBAmount = formatCoinAmount(
  //       userSharePercentageDecimal
  //         .mul(poolData.coinBAmount)
  //         .div(total_share.toString())
  //         .toFixed(0),
  //       pool.coinB
  //     );

  //     return {
  //       pool,
  //       coinA: pool.coinA,
  //       coinB: pool.coinB,
  //       userAddress,
  //       userShare: user_share.toString(),
  //       coinAAmount,
  //       coinBAmount,
  //       totalShare: total_share.toString(),
  //       userIncomes: user_incomes.toString(),
  //     };
  //   } catch (err: any) {
  //     console.log("get position error", err);
  //     return null;
  //   }
  // }

  public static async getPosition(pool: PoolInfo, userAddress: string) {
    try {
      const [res, poolData] = await Promise.all([
        actor.get_lp(pool.key, userAddress).then((data: any) => {
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        }),
        Exchange.getPoolData(pool.address),
      ]);

      if (!poolData) {
        return null;
      }

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
        userSharePercentageDecimal.mul(poolData.coinAAmount).toFixed(0),
        pool.coinA
      );
      const coinBAmount = formatCoinAmount(
        userSharePercentageDecimal.mul(poolData.coinBAmount).toFixed(0),
        pool.coinB
      );

      return {
        pool,
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
          console.log("preAddLiquidity", data);
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const utxos: UnspentOutput[] = [];

      inputs.forEach(async ({ txid, vout, sats, maybe_rune }: any) => {
        const { address, output } = getP2trAressAndScript(poolKey);

        const rune = maybe_rune[0];

        const tmpObj: UnspentOutput = {
          txid,
          vout,
          satoshis: sats.toString(),
          address: address!,
          scriptPk: output,
          pubkey: "",
          addressType: AddressType.P2TR,
          runes: [],
        };
        if (rune.id !== BITCOIN.id) {
          tmpObj.runes = [
            {
              id: rune.id,
              amount: rune.value.toString(),
            },
          ];
        }
        utxos.push(tmpObj);
      });

      const quote = {
        state:
          output.value > BigInt(0) ? DepositState.VALID : DepositState.EMPTY,
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
    sqrK: bigint
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
        .pre_withdraw_liquidity(poolKey, userAddress, sqrK)
        .then((data: any) => {
          console.log("withdraw liquidity", data);
          if (data.Ok) {
            return data.Ok as {
              input: {
                maybe_rune: [
                  {
                    id: string;
                    value: bigint;
                  }
                ];
                sats: bigint;
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

      const rune = res.input.maybe_rune[0];

      const utxo: UnspentOutput = {
        txid: res.input.txid,
        vout: res.input.vout,
        satoshis: res.input.sats.toString(),
        address: address!,
        pubkey: "",
        addressType: AddressType.P2TR,
        scriptPk: output,
        runes: [
          {
            id: rune.id,
            amount: rune.value.toString(),
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

    const pool = await Exchange.getPool(inputCoin, outputCoin);

    if (!pool) {
      return {
        state: SwapState.NO_POOL,
        inputAmount,
      };
    }

    try {
      const { output, input, nonce } = await actor
        .pre_swap(pool.key, {
          id: inputCoin.id,
          value: BigInt(inputAmount),
        })
        .then((data: any) => {
          console.log("data", data);
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const { txid, vout, sats, maybe_rune } = input;

      const rune = maybe_rune[0];

      const { output: outputScript, address } = getP2trAressAndScript(pool.key);

      const utxo: UnspentOutput = {
        txid,
        vout,
        satoshis: sats.toString(),
        address: address!,
        pubkey: "",
        addressType: AddressType.P2TR,
        scriptPk: outputScript,
        runes: [
          {
            id: rune.id,
            amount: rune.value.toString(),
          },
        ],
      };

      const poolData = await Exchange.getPoolData(pool.address);

      if (!poolData) {
        throw new Error("Invalid pool");
      }

      const quote = {
        state: SwapState.VALID,
        pool: poolData,
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
