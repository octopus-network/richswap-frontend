import { NextResponse } from "next/server";

import { gql, GraphQLClient } from "graphql-request";
import { EXCHANGE_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

const REE_INDEXER_URL = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;
// const RUNES_INDEXER_URL = process.env.NEXT_PUBLIC_RUNES_INDEXER_URL!;

const query = gql`
  query Volume7d($from: String!, $to: String!) {
    volume_tx_by_pool_by_date(where: { date: { _gte: $from, _lte: $to }, exchange_id: { _eq: ${EXCHANGE_ID} } }) {
      pool_address  
      pool_name
      volume
    }
  }
`;

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (7 - 1));

    const client = new GraphQLClient(REE_INDEXER_URL, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    const { volume_tx_by_pool_by_date } = (await client.request(query, {
      from: ymd(from),
      to: ymd(to),
    })) as {
      volume_tx_by_pool_by_date: any[];
    };

    const result = Object.values(
      volume_tx_by_pool_by_date.reduce(
        (acc, { pool_address, pool_name, volume }) => {
          if (!acc[pool_address]) {
            acc[pool_address] = { pool_address, pool_name, volume: 0 };
          }
          acc[pool_address].volume += volume;
          return acc;
        },
        {}
      )
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
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
