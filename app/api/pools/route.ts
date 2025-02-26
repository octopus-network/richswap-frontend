import { NextResponse } from "next/server";
import { BITCOIN, UNKNOWN_COIN } from "@/lib/constants";
import { Exchange } from "@/lib/exchange";
import { put } from "@vercel/blob";
import { queryRunes } from "@/lib/chain-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const cache = await fetch(
    "https://vquok3pr3bhc6tui.public.blob.vercel-storage.com/pool-list.json",
    {
      cache: "no-store",
    }
  ).then((res) => res.json());

  if (cache?.length) {
    return NextResponse.json({
      success: true,
      data: cache,
    });
  } else {
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
  }
}
