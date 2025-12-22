import axios from "axios";
import { NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";
import { ENVIRONMENT } from "@/lib/constants";
import { PoolInfo } from "@/types";

const reeIndexerUrl = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;
const STORAGE_URL = process.env.STORAGE_URL!;

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

    const pools = ((await axios
      .get(`${STORAGE_URL}/pool-list.json?t=${Date.now()}`)
      .then((res) => res.data)) ?? []) as PoolInfo[];

    const klineTableName =
      ENVIRONMENT === "staging" ? "k_line_minutes_staging" : "k_line_minutes";

    // Calculate timestamp for 1 day ago
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    const fromTs = (oneDayAgo * 1e9).toString();
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
          volume
        }
      }
    `;

    const response = (await client.request(query, {
      fromTs,
      toTs,
    })) as Record<
      string,
      {
        token: string;
        volume: number;
      }[]
    >;

    const raw = response[klineTableName] ?? [];

    // Aggregate by pool
    const aggregated = (raw ?? []).reduce((acc, item) => {
      const { token, volume } = item;
      const pool = pools.find((pool) => pool.name === token);
      if (!pool) {
        return acc;
      }

      if (!acc[pool.address]) {
        acc[pool.address] = {
          pool_address: pool.address,
          pool_name: token,
          volume,
        };
      }

      acc[pool.address].volume += volume;

      return acc;
    }, {} as Record<string, { pool_address: string; pool_name: string; volume: number }>);

    const result = Object.values(aggregated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[PoolsVolume24h] Error:", error);
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
