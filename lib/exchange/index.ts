import { actor } from "./actor";
import {
  Coin,
  DepositState,
  DonateQuote,
  DonateState,
  DepositQuote,
  UnspentOutput,
  PoolInfo,
  AddressType,
  SwapRoute,
  Position,
} from "@/types";

import { BITCOIN, RICH_POOL } from "../constants";
import {
  getP2trAressAndScript,
  formatCoinAmount,
  fetchCoinById,
  bytesToHex,
  addressToScriptPk,
} from "../utils";
import Decimal from "decimal.js";

export class Exchange {
  static coins: Coin[] = [];

  static async getCoinById(id: string) {
    const coin = this.coins.find((c) => c.id === id);
    if (!coin) {
      const _coin = await fetchCoinById(id);
      this.coins.push(_coin);
      return _coin;
    }
    return coin;
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

  public static async createPoolWithTemplate(
    coinId: string,
    template: "onetime" | "standard" = "standard"
  ) {
    const poolAddress = await actor
      .create_with_template(coinId, {
        [template]: null,
      })
      .then((data: any) => {
        if (data.Ok) {
          return data.Ok;
        } else {
          throw new Error(
            data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
          );
        }
      });
    return poolAddress;
  }

  public static async lockLp(
    address: string,
    message: string,
    signature: string
  ) {
    return await actor
      .lock_lp(address, message, signature)
      .then((data: any) => {
        console.log("lock lp res", data);
        if (data.hasOwnProperty("Ok")) {
          return data.Ok;
        } else {
          throw new Error(
            data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
          );
        }
      });
  }

  public static async getPool(
    inputCoin: Coin,
    outputCoin: Coin
  ): Promise<PoolInfo | undefined> {
    if (inputCoin.id !== BITCOIN.id && outputCoin.id !== BITCOIN.id) {
      return undefined;
    }
    const runeId = inputCoin.id === BITCOIN.id ? outputCoin.id : inputCoin.id;

    const res = (await actor.query_pool(runeId)) as {
      Ok: {
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
            coins: [{ id: string; value: bigint }];
          }
        ];
      };
    };

    if (!res?.Ok) {
      return undefined;
    }

    const data = res.Ok;

    const attributes = JSON.parse(data.attributes);

    const coinReserved = data.coin_reserved[0];

    const utxo = data.utxos[0];

    const btc_reserved = data.btc_reserved;

    const coinB = await this.getCoinById(coinReserved.id);

    const { output } = getP2trAressAndScript(data.key);

    const rune = utxo.coins[0];

    return {
      key: data.key,
      address: data.address,
      name: data.name,
      coinA: {
        ...BITCOIN,
        balance: btc_reserved.toString(),
      },
      coinB: {
        ...coinB,
        balance: rune?.value.toString() ?? "0",
      },
      lpFee: attributes.lp_revenue ? attributes.lp_revenue.toString() : "0",
      nonce: Number(data.nonce),
      coinADonation: attributes.total_btc_donation.toString(),
      coinBDonation: attributes.total_rune_donation.toString(),
      protocolRevenue: attributes.protocol_revenue.toString(),
      lpFeeRate: attributes.lp_fee_rate,
      protocolFeeRate: attributes.protocol_fee_rate,
      utxos: [
        {
          txid: utxo.txid,
          vout: utxo.vout,
          satoshis: utxo.sats.toString(),
          address: data.address,
          scriptPk: output,
          pubkey: "",
          addressType: AddressType.P2TR,
          runes: rune
            ? [
                {
                  id: rune.id,
                  amount: rune.value.toString(),
                },
              ]
            : [],
        },
      ],
    };
  }

  public static async getPoolInfo(
    address: string
  ): Promise<PoolInfo | undefined> {
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
            coins: [{ id: string; value: bigint }];
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

      const coinB = await this.getCoinById(coinReserved.id);

      return {
        key: data.key,
        address,
        name: data.name,
        coinA: {
          ...BITCOIN,
          balance: btc_reserved.toString(),
        },
        coinB: {
          ...coinB,
          balance: utxo?.coins[0]?.value.toString() ?? "0",
        },
        lpFee: attributes.lp_revenue ? attributes.lp_revenue.toString() : "0",
        nonce: Number(data.nonce),
        coinADonation: attributes.total_btc_donation.toString(),
        coinBDonation: attributes.total_rune_donation.toString(),
        protocolRevenue: attributes.protocol_revenue.toString(),
        lpFeeRate: attributes.lp_fee_rate,
        protocolFeeRate: attributes.protocol_fee_rate,
      };
    }
  }

  public static async getPosition(
    poolAddress: string,
    userAddress: string
  ): Promise<Position | null> {
    try {
      const [res, pool] = await Promise.all([
        actor.get_lp(poolAddress, userAddress).then((data: any) => {
          if (data.hasOwnProperty("Ok")) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        }),
        Exchange.getPoolInfo(poolAddress),
      ]);

      if (!pool) {
        return null;
      }

      const {
        total_share,
        user_incomes,
        user_share,
        locked_revenue,
        lock_until,
      } = res as {
        total_share: bigint;
        user_incomes: bigint;
        user_share: bigint;
        locked_revenue: bigint;
        lock_until: number;
      };

      if (!Number(user_share) || !Number(total_share)) {
        return null;
      }

      const userSharePercentageDecimal = new Decimal(user_share.toString());

      const coinAAmount = formatCoinAmount(
        userSharePercentageDecimal
          .mul(pool.coinA.balance)
          .div(total_share.toString())
          .toFixed(0),
        pool.coinA
      );
      const coinBAmount = formatCoinAmount(
        userSharePercentageDecimal
          .mul(pool.coinB.balance)
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
        lockedRevenue: locked_revenue.toString(),
        lockUntil: lock_until,
      };
    } catch (err: any) {
      console.error("Get position error", err);
      return null;
    }
  }

  public static async getLps(poolAddress: string) {
    try {
      const res = (await actor.get_all_lp(poolAddress).then((data: any) => {
        if (data.Ok) {
          return data.Ok;
        } else {
          throw new Error(
            data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
          );
        }
      })) as [
        string,
        {
          total_share: bigint;
          user_share: bigint;
          lock_until: number;
        }
      ][];

      if (!res) {
        return [];
      }

      return res.map(
        ([address, { total_share, user_share, lock_until }]) =>
          ({
            address,
            percentage: new Decimal(user_share.toString())
              .mul(100)
              .div(total_share.toString())
              .toNumber(),
            lockUntil: lock_until,
          } as any)
      );
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

      inputs.forEach(async ({ txid, vout, sats, coins }: any) => {
        const { output } = getP2trAressAndScript(pool.key);

        const rune = coins[0];

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

  public static async preDonate(
    pool: PoolInfo,
    inputAmount: string
  ): Promise<DonateQuote | undefined> {
    try {
      const { input, nonce } = await actor
        .pre_donate(pool.address, BigInt(inputAmount))
        .then((data: any) => {
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const { output } = getP2trAressAndScript(pool.key);

      const rune = input.coins[0];

      const utxo: UnspentOutput = {
        txid: input.txid,
        vout: input.vout,
        satoshis: input.sats.toString(),
        address: pool.address,
        scriptPk: output,
        pubkey: "",
        addressType: AddressType.P2TR,
        runes: [
          {
            id: rune.id,
            amount: rune.value.toString(),
          },
        ],
      };

      const quote = {
        state: rune.value > BigInt(0) ? DonateState.VALID : DonateState.EMPTY,
        coinAAmount: inputAmount,
        coinBAmount: rune.value.toString(),
        utxos: [utxo],
        nonce: nonce.toString(),
      };

      return quote;
    } catch (error: any) {
      return {
        state: DonateState.INVALID,
        coinAAmount: inputAmount,
        errorMessage: error instanceof Error ? error.message : "Unknown Error",
      };
    }
  }

  public static async preClaimRevenue(
    pool: PoolInfo,
    userAddress: string
  ): Promise<{
    utxos: UnspentOutput[];
    nonce: string;
    output: string;
  } | null> {
    const res = await actor
      .pre_claim_revenue(pool.address, userAddress)
      .then((data: any) => {
        console.log("pre claim revenue", data);
        if (data.Ok) {
          return data.Ok as {
            claim_sats: bigint;
            input: {
              coins: [
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
          };
        } else {
          throw new Error(
            data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
          );
        }
      });

    const { output } = getP2trAressAndScript(pool.key);

    const rune = res.input.coins[0];

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
      output: res.claim_sats.toString(),
    };
  }

  public static async preSelfDonate(): Promise<DonateQuote | undefined> {
    console.log("self donate");
    try {
      const { input, nonce, out_rune, out_sats } = await actor
        .pre_self_donate()
        .then((data: any) => {
          if (data.Ok) {
            return data.Ok;
          } else {
            throw new Error(
              data.Err ? Object.keys(data.Err)[0] : "Unknown Error"
            );
          }
        });

      const output = addressToScriptPk(RICH_POOL);

      const rune = input.coins[0];

      const utxo: UnspentOutput = {
        txid: input.txid,
        vout: input.vout,
        satoshis: input.sats.toString(),
        address: RICH_POOL,
        scriptPk: bytesToHex(output),
        pubkey: "",
        addressType: AddressType.P2TR,
        runes: [
          {
            id: rune.id,
            amount: rune.value.toString(),
          },
        ],
      };

      const quote = {
        state: out_sats > BigInt(0) ? DonateState.VALID : DonateState.EMPTY,
        coinAAmount: out_sats.toString(),
        coinBAmount: out_rune.value.toString(),
        utxos: [utxo],
        nonce: nonce.toString(),
      };

      return quote;
    } catch (error: any) {
      console.log("self donate error", error);
      return {
        state: DonateState.INVALID,
        coinAAmount: "0",
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
    const res = await actor
      .pre_withdraw_liquidity(pool.address, userAddress, sqrK)
      .then((data: any) => {
        console.log("withdraw liquidity", data);
        if (data.Ok) {
          return data.Ok as {
            input: {
              coins: [
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

    const coinB = await this.getCoinById(_coinB.id);

    const { output } = getP2trAressAndScript(pool.key);

    const rune = res.input.coins[0];

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

    const { txid, vout, sats, coins } = input;

    const rune = coins[0];

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

    const inputCoinIsBitcoin = inputCoin.id === BITCOIN.id;

    const swapPrice = new Decimal(inputAmount)
      .div(output.value.toString())
      .toNumber();

    const marketPrice = new Decimal(
      inputCoinIsBitcoin ? pool.coinA.balance : pool.coinB.balance
    )
      .div(inputCoinIsBitcoin ? pool.coinB.balance : pool.coinA.balance)
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

    if (inputCoinIsBitcoin) {
      if (Number(formatCoinAmount(inputAmount, BITCOIN)) < 0.0001) {
        throw new Error("Too small funds");
      }
    } else {
      if (Number(formatCoinAmount(output.value.toString(), BITCOIN)) < 0.0001) {
        throw new Error("Too small funds");
      }
    }

    const route = {
      pool,
      inputCoin,
      outputCoin,
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

  public static async getFeeCollector() {
    const res = (await actor.get_fee_collector()) as string;

    return res;
  }

  public static async preExtractFee(poolAddress: string) {
    const res = await actor.pre_extract_fee(poolAddress).then((data: any) => {
      if (data.Ok) {
        return data.Ok as {
          input: {
            coins: [
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
          output: {
            id: string;
            value: bigint;
          };
        };
      } else {
        throw new Error(data.Err ? Object.keys(data.Err)[0] : "Unknown Error");
      }
    });
    const output = addressToScriptPk(poolAddress);

    const rune = res.input.coins[0];

    const utxo: UnspentOutput = {
      txid: res.input.txid,
      vout: res.input.vout,
      satoshis: res.input.sats.toString(),
      address: poolAddress,
      pubkey: "",
      addressType: AddressType.P2TR,
      scriptPk: bytesToHex(output),
      runes: [
        {
          id: rune.id,
          amount: rune.value.toString(),
        },
      ],
    };

    return {
      utxo,
      nonce: res.nonce.toString(),
      outputAmount: res.output.value.toString(),
    };
  }
}
