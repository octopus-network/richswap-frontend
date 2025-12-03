import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";
import { ENVIRONMENT } from "@/lib/constants";

const reeIndexerUrl = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = new GraphQLClient(reeIndexerUrl, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    const klineTableName =
      ENVIRONMENT === "staging" ? "k_line_minutes_staging" : "k_line_minutes";

    // Calculate timestamp for 7 days ago
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    const fromTs = (sevenDaysAgo * 1e9).toString();
    const toTs = (now * 1e9).toString();

    const query = gql`
      query GetLpFee7d($fromTs: bigint!, $toTs: bigint!) {
        ${klineTableName}(
          where: {
            timestamp: { _gte: $fromTs, _lte: $toTs }
          }
          order_by: { timestamp: asc }
        ) {
          token
          tx_lp_revenue
          tx_protocol_revenue
        }
      }
    `;

    const { [klineTableName]: raw } = (await client.request(query, {
      fromTs,
      toTs,
    })) as {
      [klineTableName]: {
        token: string;
        tx_lp_revenue: number;
        tx_protocol_revenue: number;
      }[];
    };

    // Aggregate by token (pool)
    const aggregated = (raw ?? []).reduce((acc, item) => {
      const { token, tx_lp_revenue, tx_protocol_revenue } = item;

      if (!acc[token]) {
        acc[token] = {
          token,
          lp_fee: 0,
          protocol_fee: 0,
        };
      }

      acc[token].lp_fee += Number(tx_lp_revenue || 0);
      acc[token].protocol_fee += Number(tx_protocol_revenue || 0);

      return acc;
    }, {} as Record<string, { token: string; lp_fee: number; protocol_fee: number }>);

    const result = Object.values(aggregated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[LpFee7d] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || error.toString()
            : "Unknown Error",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
