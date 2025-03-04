import { NextResponse } from "next/server";
import { BITCOIN, UNKNOWN_COIN } from "@/lib/constants";
import { Exchange } from "@/lib/exchange";
import { put } from "@vercel/blob";

import { OpenApi } from "@/lib/open-api";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;
const UNISAT_API = process.env.UNISAT_API!;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await Exchange.getPoolList();

    const pools = [];

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const coinRes = await Promise.all(
      res.map(({ name }) => openApi.getRunesInfoList(name))
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
        coinB: { ...coinB, balance: coin_reserved[0].value.toString() },
      });
    }

    await put("pool-list.json", JSON.stringify(pools), {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 15,
    });

    return NextResponse.json({
      success: true,
      data: pools,
    });
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unkown Error",
      success: false,
    });
  }
}
