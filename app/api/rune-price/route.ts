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
      query GetRunePrice($token: String!, $fromTs: bigint!, $toTs: bigint!) {
        k_line_minutes(
          where: {
            token: { _eq: $token }
            timestamp: { _gte: $fromTs, _lte: $toTs }
          }
          order_by: { timestamp: desc }
          limit: 2
        ) {
          close
          timestamp
          market_cap
          tvl
        }
      }
    `;

    const fromTs = (oneDayAgo * 1e9).toString();
    const toTs = (now * 1e9).toString();

    const { k_line_minutes: raw } = (await client.request(query, {
      token: rune,
      fromTs,
      toTs,
    })) as {
      k_line_minutes: {
        close: string;
        timestamp: number;
        market_cap: number;
        tvl: number;
      }[];
    };

    if (!raw || raw.length === 0) {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const fallbackQuery = gql`
        query FallbackPrice($token: String!, $fromTs: bigint!, $toTs: bigint!) {
          k_line_minutes(
            where: {
              token: { _eq: $token }
              timestamp: { _gte: $fromTs, _lte: $toTs }
            }
            order_by: { timestamp: desc }
            limit: 1
          ) {
            close
            timestamp
            tvl
            market_cap
          }
        }
      `;

      try {
        const fallbackResult = (await client.request(fallbackQuery, {
          token: rune,
          fromTs: (thirtyDaysAgo * 1e9).toString(),
          toTs: (now * 1e9).toString(),
        })) as {
          k_line_minutes: {
            close: string;
            timestamp: number;
            market_cap: number;
            tvl: number;
          }[];
        };

        if (fallbackResult.k_line_minutes?.length > 0) {
          const latestPrice = Number(fallbackResult.k_line_minutes[0].close);
          const market_cap = fallbackResult.k_line_minutes[0].market_cap;
          const tvl = fallbackResult.k_line_minutes[0].tvl;
          return NextResponse.json({
            success: true,
            data: {
              price: latestPrice,
              market_cap,
              tvl,
              change: 0,
              hasData: true,
              dataPoints: 1,
              timestamp: Math.floor(
                Number(fallbackResult.k_line_minutes[0].timestamp) / 1e9
              ),
              fallback: true,
            },
          });
        }
      } catch (fallbackError) {
        console.error("[RunePrice] Fallback query failed:", fallbackError);
      }

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

    const sortedData = raw.sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );
    const currentPrice = Number(sortedData[0].close);

    let change = 0;
    if (sortedData.length >= 2) {
      const price24hAgo = Number(sortedData[1].close);
      if (price24hAgo > 0) {
        change = ((currentPrice - price24hAgo) / price24hAgo) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        price: currentPrice,
        market_cap: sortedData[0].market_cap,
        tvl: sortedData[0].tvl,
        change: change,
        hasData: true,
        dataPoints: raw.length,
        timestamp: Math.floor(Number(sortedData[0].timestamp) / 1e9),
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
