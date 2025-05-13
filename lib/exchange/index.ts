import { actor } from "./actor";
import {
  Coin,
  DepositState,
  DepositQuote,
  UnspentOutput,
  PoolInfo,
  AddressType,
  PoolData,
  SwapRoute,
} from "@/types";

import { BITCOIN } from "../constants";
import {
  getP2trAressAndScript,
  formatCoinAmount,
  fetchCoinById,
} from "../utils";
import Decimal from "decimal.js";

import axios from "axios";

export class Exchange {
  public static async getPool(inputCoin: Coin, outputCoin: Coin) {
    if (inputCoin.id !== BITCOIN.id && outputCoin.id !== BITCOIN.id) {
      return undefined;
    }
    const poolList = await axios
      .get<{
        data: PoolInfo[];
      }>("/api/pools")
      .then((res) => res.data.data);

    const runeId = inputCoin.id === BITCOIN.id ? outputCoin.id : inputCoin.id;

    const pool = poolList.find((p) => p.coinB.id === runeId);

    return pool;
  }

  public static async createPool(coinId: string) {
    const poolAddress = await actor.create(coinId).then((data: any) => {
      if (data.Ok) {
        return data.Ok;
      } else {
        throw new Error(data.Err ? Object.keys(data.Err)[0] : "Unknown Error");
      }
    });
    return poolAddress;
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

      const btc_reserved = data.btc_reserved;

      return {
        key: data.key,
        address,
        name: data.name,
        coinAId: BITCOIN.id,
        coinBId: coinReserved?.id,
        coinAAmount: btc_reserved.toString(),
        coinBAmount: utxo?.maybe_rune[0]?.value.toString() ?? "0",
        incomes: attributes.protocol_revenue.toString(),
      };
    }
  }

  public static async getPosition(pool: PoolInfo, userAddress: string) {
    try {
      const [res, poolData] = await Promise.all([
        actor.get_lp(pool.address, userAddress).then((data: any) => {
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

      const { total_share, user_incomes, user_share } = res as {
        total_share: bigint;
        user_incomes: bigint;
        user_share: bigint;
      };

      if (!Number(user_share) || !Number(total_share)) {
        return null;
      }

      const userSharePercentageDecimal = new Decimal(user_share.toString());

      const coinAAmount = formatCoinAmount(
        userSharePercentageDecimal
          .mul(poolData.coinAAmount)
          .div(total_share.toString())
          .toFixed(0),
        pool.coinA
      );
      const coinBAmount = formatCoinAmount(
        userSharePercentageDecimal
          .mul(poolData.coinBAmount)
          .div(total_share.toString())
          .toFixed(0),
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
        totalShare: total_share.toString(),
        userIncomes: user_incomes.toString(),
      };
    } catch (err: any) {
      console.error("Get position error", err);
      return null;
    }
  }

  public static async getLps(poolAddress: string) {
    try {
      const res = await actor.get_all_lp(poolAddress).then((data: any) => {
        if (data.Ok) {
          return data.Ok;
        } else {
          throw new Error(
            data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
          );
        }
      });

      if (!res) {
        return [];
      }

      const promises = res.map(([userAddress]: [string, string]) =>
        actor
          .get_lp(poolAddress, userAddress)
          .then((data: any) => {
            if (data.Ok) {
              return data.Ok;
            } else {
              throw new Error(
                data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
              );
            }
          })
          .then(({ total_share, user_share }) => {
            return {
              address: userAddress,
              percentage: new Decimal(user_share.toString())
                .mul(100)
                .div(total_share.toString())
                .toNumber(),
            };
          })
          .catch(() => null)
      );

      return Promise.all(promises);
    } catch (err: any) {
      console.log("get all lp error", err);
      return [];
    }
  }

  public static async preAddLiquidity(
    pool: PoolInfo,
    coin: Coin,
    coinAmount: string
  ): Promise<DepositQuote | undefined> {
    try {
      const { output, inputs, nonce } = await actor
        .pre_add_liquidity(pool.address, {
          id: coin.id,
          value: BigInt(coinAmount),
        })
        .then((data: any) => {
          console.log("pre add liquidity", pool, data);
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
        const { output } = getP2trAressAndScript(pool.key);

        const rune = maybe_rune[0];

        const tmpObj: UnspentOutput = {
          txid,
          vout,
          satoshis: sats.toString(),
          address: pool.address,
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
    pool: PoolInfo,
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
        .pre_withdraw_liquidity(pool.address, userAddress, sqrK)
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

      const { output } = getP2trAressAndScript(pool.key);

      const rune = res.input.maybe_rune[0];

      const utxo: UnspentOutput = {
        txid: res.input.txid,
        vout: res.input.vout,
        satoshis: res.input.sats.toString(),
        address: pool.address,
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

  public static async getSwapRoute(
    inputCoin: Coin,
    outputCoin: Coin,
    inputAmount: string
  ): Promise<SwapRoute> {
    const pool = await Exchange.getPool(inputCoin, outputCoin);

    if (!pool) {
      throw new Error("No Pool");
    }

    console.log(pool.address, {
      id: inputCoin.id,
      value: BigInt(inputAmount),
    });

    const { output, input, nonce, price_impact } = await actor
      .pre_swap(pool.address, {
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

    const { output: outputScript } = getP2trAressAndScript(pool.key);

    const utxo: UnspentOutput = {
      txid,
      vout,
      satoshis: sats.toString(),
      address: pool.address,
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

    const inputCoinIsBitcoin = inputCoin.id === BITCOIN.id;

    const swapPrice = new Decimal(inputAmount)
      .div(output.value.toString())
      .toNumber();

    const marketPrice = new Decimal(
      inputCoinIsBitcoin ? poolData.coinAAmount : poolData.coinBAmount
    )
      .div(inputCoinIsBitcoin ? poolData.coinBAmount : poolData.coinAAmount)
      .toNumber();

    const priceImpact = new Decimal((swapPrice - marketPrice) * 100)
      .div(marketPrice)
      .toNumber();

    const runePriceInSats = new Decimal(
      inputCoinIsBitcoin ? inputAmount : output.value.toString()
    )
      .div(
        new Decimal(
          inputCoinIsBitcoin ? output.value.toString() : inputAmount
        ).div(
          Math.pow(
            10,
            inputCoinIsBitcoin ? outputCoin.decimals : inputCoin.decimals
          )
        )
      )
      .toNumber();

    const route = {
      pool: poolData,
      inputAmount,
      outputAmount: output.value.toString(),
      poolUtxos: [utxo],
      nonce: nonce.toString(),
      runePriceInSats,
      priceImpact: inputCoinIsBitcoin ? priceImpact : -priceImpact,
      poolPriceImpact: price_impact / 100,
    };

    return route;
  }
}
