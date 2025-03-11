import { NextResponse } from "next/server";
import { Exchange } from "@/lib/exchange";
import { OpenApi } from "@/lib/open-api";
import { UNKNOWN_COIN, BITCOIN } from "@/lib/constants";
import { PoolInfo } from "@/types";
import { put } from "@vercel/blob";
import { limitFunction } from "p-limit";

export const dynamic = "force-dynamic";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;
const UNISAT_API = process.env.UNISAT_API!;

export async function GET() {
  try {
    const res = await Exchange.getPoolList();

    const pools: PoolInfo[] = [];

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const limitGetRunesInfoList = limitFunction(
      async (coinId: string) => openApi.getRunesInfoList(coinId),
      { concurrency: 4 }
    );

    const coinRes = await Promise.all(
      res.map(({ coin_reserved }) =>
        coin_reserved.length
          ? limitGetRunesInfoList(coin_reserved[0].id)
          : { detail: [] }
      )
    );

    for (let i = 0; i < res.length; i++) {
      const { name, address, btc_reserved, coin_reserved, key } = res[i];

      const coinA = BITCOIN;
      const { detail: coinBRes } = coinRes[i];

      let coinB = UNKNOWN_COIN;
      if (coinBRes.length) {
        const {
          spacedRune,
          rune,
          symbol,
          divisibility,
          etching,
          runeid,
          number,
        } = coinBRes[0];

        coinB = {
          id: runeid,
          name: spacedRune,
          runeId: rune,
          runeSymbol: symbol,
          decimals: divisibility,
          etching,
          number,
        };
      }

      pools.push({
        key,
        address,
        name,
        coinA: { ...coinA, balance: btc_reserved.toString() },
        coinB: { ...coinB, balance: coin_reserved[0]?.value.toString() ?? "0" },
      });
    }

    await put("pool-list.json", JSON.stringify(pools), {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      data: pools,
    });
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
