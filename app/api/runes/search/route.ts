import { NextRequest, NextResponse } from "next/server";

import { gql, GraphQLClient } from "graphql-request";

// Cache for 5 minutes on CDN, revalidate in background
export const revalidate = 300;

const RUNES_INDEXER_URL = process.env.NEXT_PUBLIC_RUNES_INDEXER_URL!;

const runesQuery = gql`
  query GetRunes($keyword: String!, $regex: String!) @cached {
    runes(
      where: {
        _or: [
          { spaced_rune: { _iregex: $regex } }
          { rune_id: { _eq: $keyword } }
        ]
        reorg: { _eq: false }
      }
      limit: 50
    ) {
      rune_id
      spaced_rune
      symbol
      id
      number
      etching
      divisibility
    }
  }
`;

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");
  try {
    if (!keyword) {
      throw new Error("Missing parameter(s)");
    }

    const runesClient = new GraphQLClient(RUNES_INDEXER_URL);

    const pattern = keyword
      .split("")
      .filter((t) => {
        if (t === "•" || t === " ") {
          return false;
        }
        return true;
      })
      .join("•?");

    const { runes } = (await runesClient.request(runesQuery, {
      keyword,
      regex: `(?i)${pattern}`,
    })) as {
      runes: {
        rune_id: string;
        symbol: string;
        spaced_rune: string;
        divisibility: number;
        etching: string;
      }[];
    };

    const response = NextResponse.json({
      success: true,
      data: runes?.length
        ? runes.map(
            ({ rune_id, spaced_rune, symbol, divisibility, etching }) => ({
              id: rune_id,
              name: spaced_rune,
              runeId: spaced_rune.replaceAll("•", ""),
              runeSymbol: symbol,
              decimals: divisibility,
              etching,
            })
          )
        : [],
    });

    // Cache for 5 minutes in browser and CDN
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
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
