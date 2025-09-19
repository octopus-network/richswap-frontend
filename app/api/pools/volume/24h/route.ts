import { NextResponse } from "next/server";

import { gql, GraphQLClient } from "graphql-request";
import { EXCHANGE_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

const REE_INDEXER_URL = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;
// const RUNES_INDEXER_URL = process.env.NEXT_PUBLIC_RUNES_INDEXER_URL!;

const query = gql`
  {
    volume_tx_by_pool_by_period(where: { period: { _eq: "24 Hours" }, exchange_id: { _eq: ${EXCHANGE_ID} } }) {
      pool_address  
      pool_name
      volume
    }
  }
`;

export async function GET() {
  try {
    const client = new GraphQLClient(REE_INDEXER_URL, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    const { volume_tx_by_pool_by_period } = (await client.request(query)) as {
      volume_tx_by_pool_by_period: any[];
    };

    return NextResponse.json({
      success: true,
      data: volume_tx_by_pool_by_period,
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
