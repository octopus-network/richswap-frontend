import { NextResponse } from "next/server";
import { BITCOIN, UNKNOWN_COIN } from "@/lib/constants";
import { Exchange } from "@/lib/exchange";

import { queryRunes } from "@/lib/chain-api";

export async function GET() {
  try {
    const res = await Exchange.getPoolList();

    const pools = [];

    for (let i = 0; i < res.length; i++) {
      const { coinBId, ...rest } = res[i];

      const coinA = BITCOIN;

      const queryRes = await queryRunes(coinBId);

      const coinB = queryRes?.length
        ? queryRes.map(
            ({
              runeid,
              spacedRune,
              rune,
              symbol,
              divisibility,
              etching,
              number,
            }) => ({
              id: runeid,
              name: spacedRune,
              runeId: rune,
              runeSymbol: symbol,
              decimals: divisibility,
              etching,
              number,
            })
          )[0]
        : UNKNOWN_COIN;

      pools.push({
        ...rest,
        coinA,
        coinB,
      });
    }

    return NextResponse.json({
      success: true,
      data: pools,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unkown Error",
      success: false,
    });
  }
}
