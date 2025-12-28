import { NextResponse, NextRequest } from "next/server";

import { gql, GraphQLClient } from "graphql-request";
import { EXCHANGE_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

const REE_INDEXER_URL = process.env.NEXT_PUBLIC_REE_INDEXER_URL!;

const RICH_SWAP_ACTIONS = ["swap"];
const MAX_VALUE_SORT_LIMIT = 5000;
const BTC_COIN_ID = "0:0";

const buildQueryByTime = (orderDirection: "asc" | "desc") => gql`
  query GetIntentionsByPool(
    $poolAddress: String!
    $actions: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    intention(
      where: {
        exchange_id: { _eq: "${EXCHANGE_ID}" }
        pool_address: { _eq: $poolAddress }
        action: { _in: $actions }
      }
      limit: $limit
      offset: $offset
      order_by: { invoke_arg: { tx_sent: { time: ${orderDirection} } } }
    ) {
      exchange_id
      action
      nonce
      invoke_args_tx_id
      pool_address
      step_index
      invoke_arg {
        tx_sent {
          time
          tx_id
          status_info
        }
      }
      input_coins {
        id
        index
        from
        intention_step_index
        intention_tx_id
        value
      }
      output_coins {
        id
        index
        intention_step_index
        intention_tx_id
        to
        value
      }
    }
    intention_aggregate(
      where: {
        exchange_id: { _eq: "${EXCHANGE_ID}" }
        pool_address: { _eq: $poolAddress }
        action: { _in: $actions }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const buildQueryByTimeWithInitiator = (orderDirection: "asc" | "desc") => gql`
  query GetIntentionsByPoolAndInitiator(
    $poolAddress: String!
    $initiator: String!
    $actions: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    intention(
      where: {
        _and: [
          { invoke_arg: { initiator: { _eq: $initiator } } }
          { exchange_id: { _eq: "${EXCHANGE_ID}" } }
          { pool_address: { _eq: $poolAddress } }
          { action: { _in: $actions } }
        ]
      }
      limit: $limit
      offset: $offset
      order_by: { invoke_arg: { tx_sent: { time: ${orderDirection} } } }
    ) {
      exchange_id
      action
      nonce
      invoke_args_tx_id
      pool_address
      step_index
      invoke_arg {
        tx_sent {
          time
          tx_id
          status_info
        }
      }
      input_coins {
        id
        index
        from
        intention_step_index
        intention_tx_id
        value
      }
      output_coins {
        id
        index
        intention_step_index
        intention_tx_id
        to
        value
      }
    }
    intention_aggregate(
      where: {
        _and: [
          { invoke_arg: { initiator: { _eq: $initiator } } }
          { exchange_id: { _eq: "${EXCHANGE_ID}" } }
          { pool_address: { _eq: $poolAddress } }
          { action: { _in: $actions } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const queryAllByPool = gql`
  query GetAllIntentionsByPool(
    $poolAddress: String!
    $actions: [String!]!
    $limit: Int!
  ) {
    intention(
      where: {
        exchange_id: { _eq: "${EXCHANGE_ID}" }
        pool_address: { _eq: $poolAddress }
        action: { _in: $actions }
      }
      limit: $limit
    ) {
      exchange_id
      action
      nonce
      invoke_args_tx_id
      pool_address
      step_index
      invoke_arg {
        tx_sent {
          time
          tx_id
          status_info
        }
      }
      input_coins {
        id
        index
        from
        intention_step_index
        intention_tx_id
        value
      }
      output_coins {
        id
        index
        intention_step_index
        intention_tx_id
        to
        value
      }
    }
    intention_aggregate(
      where: {
        exchange_id: { _eq: "${EXCHANGE_ID}" }
        pool_address: { _eq: $poolAddress }
        action: { _in: $actions }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const queryAllByPoolAndInitiator = gql`
  query GetAllIntentionsByPoolAndInitiator(
    $poolAddress: String!
    $initiator: String!
    $actions: [String!]!
    $limit: Int!
  ) {
    intention(
      where: {
        _and: [
          { invoke_arg: { initiator: { _eq: $initiator } } }
          { exchange_id: { _eq: "${EXCHANGE_ID}" } }
          { pool_address: { _eq: $poolAddress } }
          { action: { _in: $actions } }
        ]
      }
      limit: $limit
    ) {
      exchange_id
      action
      nonce
      invoke_args_tx_id
      pool_address
      step_index
      invoke_arg {
        tx_sent {
          time
          tx_id
          status_info
        }
      }
      input_coins {
        id
        index
        from
        intention_step_index
        intention_tx_id
        value
      }
      output_coins {
        id
        index
        intention_step_index
        intention_tx_id
        to
        value
      }
    }
    intention_aggregate(
      where: {
        _and: [
          { invoke_arg: { initiator: { _eq: $initiator } } }
          { exchange_id: { _eq: "${EXCHANGE_ID}" } }
          { pool_address: { _eq: $poolAddress } }
          { action: { _in: $actions } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

interface IntentionCoin {
  id: string;
  index: number;
  from?: string;
  to?: string;
  intention_step_index: number;
  intention_tx_id: string;
  value: string;
}

interface Intention {
  exchange_id: string;
  action: string;
  nonce: string;
  invoke_args_tx_id: string;
  pool_address: string;
  step_index: number;
  invoke_arg?: {
    tx_sent?: {
      time?: string;
    };
  };
  input_coins: IntentionCoin[];
  output_coins: IntentionCoin[];
}

interface IntentionResponse {
  intention: Intention[];
  intention_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

function getSortValue(intention: Intention): bigint {
  const hasBtcInput = intention.input_coins.some(
    (coin) => coin.id === BTC_COIN_ID
  );

  if (hasBtcInput) {
    const btcCoin = intention.input_coins.find(
      (coin) => coin.id === BTC_COIN_ID
    );
    return BigInt(btcCoin?.value || "0");
  } else {
    const btcCoin = intention.output_coins.find(
      (coin) => coin.id === BTC_COIN_ID
    );
    return BigInt(btcCoin?.value || "0");
  }
}

export async function GET(req: NextRequest) {
  try {
    const poolAddress = req.nextUrl.searchParams.get("poolAddress");
    const initiator = req.nextUrl.searchParams.get("initiator");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "time"; // time | value
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc"; // asc | desc

    if (!poolAddress) {
      throw new Error("poolAddress is required");
    }

    const client = new GraphQLClient(REE_INDEXER_URL, {
      fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
        fetch(url as string, {
          ...options,
          cache: "no-store",
        }),
    });

    let intentions: Intention[];
    let total: number;

    if (sortBy === "value") {
      let result: IntentionResponse;

      if (initiator) {
        result = await client.request<IntentionResponse>(
          queryAllByPoolAndInitiator,
          {
            poolAddress,
            initiator,
            actions: RICH_SWAP_ACTIONS,
            limit: MAX_VALUE_SORT_LIMIT,
          }
        );
      } else {
        result = await client.request<IntentionResponse>(queryAllByPool, {
          poolAddress,
          actions: RICH_SWAP_ACTIONS,
          limit: MAX_VALUE_SORT_LIMIT,
        });
      }

      total = result.intention_aggregate.aggregate.count;

      const sortedIntentions = [...result.intention].sort((a, b) => {
        const valueA = getSortValue(a);
        const valueB = getSortValue(b);
        if (sortOrder === "asc") {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
      });

      intentions = sortedIntentions.slice(offset, offset + limit);
    } else {
      const orderDirection = sortOrder === "asc" ? "asc" : "desc";
      let result: IntentionResponse;

      if (initiator) {
        result = await client.request<IntentionResponse>(
          buildQueryByTimeWithInitiator(orderDirection),
          {
            poolAddress,
            initiator,
            actions: RICH_SWAP_ACTIONS,
            limit,
            offset,
          }
        );
      } else {
        result = await client.request<IntentionResponse>(
          buildQueryByTime(orderDirection),
          {
            poolAddress,
            actions: RICH_SWAP_ACTIONS,
            limit,
            offset,
          }
        );
      }

      intentions = result.intention;
      total = result.intention_aggregate.aggregate.count;
    }

    return NextResponse.json({
      success: true,
      data: {
        intentions,
        total,
        limit,
        offset,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
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
