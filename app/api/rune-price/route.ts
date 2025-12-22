import { NextRequest, NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";

export const dynamic = "force-dynamic";

const reeIndexerUrl = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;

export async function GET(req: NextRequest) {
  try {
    const rune = req.nextUrl.searchParams.get("rune");

    if (!rune) {
      throw new Error("Missing rune parameter");
    }

    const client = new GraphQLClient(reeIndexerUrl, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    const query = gql`
      query GetRunePrice(
        $token: String!
        $nowTs: bigint!
        $oneDayAgoTs: bigint!
      ) {
        current: k_line_minutes(
          where: { token: { _eq: $token }, timestamp: { _lte: $nowTs } }
          order_by: { timestamp: desc }
          limit: 1
        ) {
          close
          timestamp
          market_cap
          tvl
        }

        day_ago: k_line_minutes(
          where: { token: { _eq: $token }, timestamp: { _lte: $oneDayAgoTs } }
          order_by: { timestamp: desc }
          limit: 1
        ) {
          close
          timestamp
        }
      }
    `;

    const nowTs = (now * 1e9).toString();
    const oneDayAgoTs = (oneDayAgo * 1e9).toString();

    const result = (await client.request(query, {
      token: rune,
      nowTs,
      oneDayAgoTs,
    })) as {
      current: {
        close: string;
        timestamp: number;
        market_cap: number;
        tvl: number;
      }[];
      day_ago: {
        close: string;
        timestamp: number;
      }[];
    };

    if (!result.current || result.current.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          price: 0,
          market_cap: 0,
          tvl: 0,
          change: 0,
          hasData: false,
        },
      });
    }

    const currentData = result.current[0];
    const currentPrice = Number(currentData.close);

    let change = 0;
    if (result.day_ago && result.day_ago.length > 0) {
      const price24hAgo = Number(result.day_ago[0].close);
      if (price24hAgo > 0) {
        change = ((currentPrice - price24hAgo) / price24hAgo) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        price: currentPrice,
        market_cap: currentData.market_cap,
        tvl: currentData.tvl,
        change: change,
        hasData: true,
        timestamp: Math.floor(Number(currentData.timestamp) / 1e9),
      },
    });
  } catch (error) {
    console.error("[RunePrice] Error:", error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unknown Error",
      success: false,
    });
  }
}
