import { NextRequest, NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";

export const dynamic = "force-dynamic";

const runesIndexerUrl = process.env.NEXT_PUBLIC_RUNES_INDEXER_URL!;

const holdersQuery = gql`
  query GetHolders($runeId: String!) {
    address_rune_balance_aggregate(
      where: { rune_id: { _eq: $runeId }, balance: { _gt: "0" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const runeId = req.nextUrl.searchParams.get("runeId");

    if (!runeId) {
      throw new Error("Missing runeId parameter");
    }

    const client = new GraphQLClient(runesIndexerUrl, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    const result = (await client.request(holdersQuery, {
      runeId,
    })) as {
      address_rune_balance_aggregate: {
        aggregate: {
          count: number;
        };
      };
    };

    return NextResponse.json({
      success: true,
      data: {
        holders: result.address_rune_balance_aggregate.aggregate.count,
      },
    });
  } catch (error) {
    console.error("[Holders] Error:", error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unknown Error",
      success: false,
    });
  }
}

