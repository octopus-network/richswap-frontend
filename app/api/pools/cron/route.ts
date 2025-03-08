import { NextResponse } from "next/server";
import { BITCOIN, UNKNOWN_COIN } from "@/lib/constants";
import { Exchange } from "@/lib/exchange";
import { put } from "@vercel/blob";
import { queryRunes } from "@/lib/chain-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await Exchange.getPoolList();

    const pools = [];

    const coinRes = await Promise.all(
      res.map(({ coinBId }) =>
        queryRunes(coinBId).then((data) =>
          data.length
            ? data.map(
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
            : UNKNOWN_COIN
        )
      )
    );

    console.log(res);

    for (let i = 0; i < res.length; i++) {
      const { ...rest } = res[i];

      const coinA = BITCOIN;
      const coinB = coinRes[i];

      pools.push({
        ...rest,
        coinA,
        coinB,
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
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unkown Error",
      success: false,
    });
  }
}
