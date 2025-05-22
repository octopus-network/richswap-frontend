import { NextResponse } from "next/server";

import { OpenApi } from "@/lib/open-api";
import { UNKNOWN_COIN, BITCOIN, EXCHANGE_ID } from "@/lib/constants";
import { PoolInfo } from "@/types";
import { put } from "@vercel/blob";
import { limitFunction } from "p-limit";

import { gql, GraphQLClient } from "graphql-request";

export const dynamic = "force-dynamic";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;
const UNISAT_API = process.env.UNISAT_API!;

const REE_INDEXER_URL = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;
// const RUNES_INDEXER_URL = process.env.NEXT_PUBLIC_RUNES_INDEXER_URL!;

const query = gql`
  {
    exchange_view {
      logo
      exchange_link
      exchange_id
      description
      canister_id
      name
      x_link
      status
      pool_infos {
        address
        attributes
        btc_reserved
        exchange_id
        key
        key_derivation_path
        name
        nonce
        coin_reserveds {
          id
          index
          pool_exchange_id
          pool_name
          value
        }
      }
    }
  }
`;

// const runesQuery = gql`
//   query GetRunes($ids: [String!]) {
//     runes(where: { rune_id: { _in: $ids }, reorg: { _eq: false } }) {
//       rune_id
//       symbol
//       spaced_rune
//       divisibility
//       etching
//     }
//   }
// `;

export async function GET() {
  try {
    const client = new GraphQLClient(REE_INDEXER_URL, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    // const runesClient = new GraphQLClient(RUNES_INDEXER_URL, {
    //   fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
    //     fetch(url as string, {
    //       ...options,
    //       cache: "no-store",
    //     }),
    // });

    const { exchange_view } = (await client.request(query)) as {
      exchange_view: {
        exchange_id: string;
        pool_infos: {
          address: string;
          attributes: string;
          btc_reserved: number;
          coin_reserveds: { id: string; value: number }[];
          name: string;
          nonce: number;
          key: string;
        }[];
      }[];
    };

    const exchangeData = exchange_view.find(
      (ex) => ex.exchange_id === EXCHANGE_ID
    );

    const res =
      exchangeData?.pool_infos.sort(
        (a, b) => b.btc_reserved - a.btc_reserved
      ) ?? [];

    const pools: PoolInfo[] = [];

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const limitGetRunesInfoList = limitFunction(
      async (coinId: string) => openApi.getRunesInfoList(coinId),
      { concurrency: 1 }
    );

    // const coinIds = res
    //   .filter(({ coin_reserveds }) => !!coin_reserveds.length)
    //   .map(({ coin_reserveds }) => coin_reserveds[0].id);

    // const coinRes = await runesClient.request(runesQuery, {
    //   ids: coinIds,
    // });

    // console.log(
    //   RUNES_INDEXER_URL,
    //   coinIds,
    //   coinRes,
    //   JSON.stringify({
    //     ids: coinIds,
    //   })
    // );

    const coinRes = await Promise.all(
      res.map(({ coin_reserveds }) =>
        coin_reserveds.length
          ? limitGetRunesInfoList(coin_reserveds[0].id)
          : { detail: [] }
      )
    );

    for (let i = 0; i < res.length; i++) {
      const {
        name,
        address,
        attributes,
        btc_reserved,
        coin_reserveds,
        key,
        nonce,
      } = res[i];

      const coinA = BITCOIN;
      const { detail: coinBRes } = coinRes[i];

      const attributesJson = attributes ? JSON.parse(attributes) : {};

      let coinB = UNKNOWN_COIN;
      if (coinBRes.length) {
        const {
          spacedRune,
          rune,
          symbol,
          divisibility,
          etching,
          runeid,
          number,
        } = coinBRes[0];

        coinB = {
          id: runeid,
          name: spacedRune,
          runeId: rune,
          runeSymbol: symbol,
          decimals: divisibility,
          etching,
          number,
        };
      }

      pools.push({
        key,
        address,
        name,
        coinA: { ...coinA, balance: btc_reserved.toString() },
        nonce,
        lpFee: attributesJson.lp_revenue
          ? attributesJson.lp_revenue.toString()
          : "0",
        coinB: {
          ...coinB,
          balance: coin_reserveds[0]?.value.toString() ?? "0",
        },
      });
    }

    await put("pool-list.json", JSON.stringify(pools), {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 10,
    });

    return NextResponse.json({
      success: true,
      data: pools,
    });
  } catch (error) {
    console.log(error);
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
