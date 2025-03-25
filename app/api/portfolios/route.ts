import { NextRequest, NextResponse } from "next/server";

import axios from "axios";
// import Decimal from "decimal.js";
import { BITCOIN } from "@/lib/constants";
// import { formatCoinAmount } from "@/lib/utils";
import { PoolInfo, PoolData } from "@/types";

const STORAGE_URL = process.env.STORAGE_URL!;

export const dynamic = "force-dynamic";

import { actor } from "@/lib/exchange/actor";

async function getPoolData(address: string): Promise<PoolData | undefined> {
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

// async function getPosition(pool: PoolInfo, userAddress: string) {
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
//       getPoolData(pool.address),
//     ]);

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

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const pools = (await axios(`${STORAGE_URL}/pool-list.json`).then(
      (res) => res.data
    )) as PoolInfo[];

    const poolDatas = await Promise.all([
      actor.get_pool_info({
        pool_address:
          "tb1pfr420a6qr8t00xwjyfz7x4lg2ppdqnnm3n7gk8x4q4qra93wx88qpam69j",
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: poolDatas,
      pools,
    });

    // const portfolios = await Promise.all(
    //   pools.map((pool) => getPosition(pool, address))
    // ).then((res) => res.filter((position) => !!position));

    // return NextResponse.json({
    //   success: true,
    //   data: portfolios,
    // });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || error.toString()
            : "Unkown Error",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
