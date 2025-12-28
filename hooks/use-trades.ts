import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TradeIntentionCoin {
  id: string;
  index: number;
  from?: string;
  to?: string;
  intention_step_index: number;
  intention_tx_id: string;
  value: string;
}

export interface TradeIntention {
  exchange_id: string;
  action: string;
  nonce: string;
  invoke_args_tx_id: string;
  pool_address: string;
  step_index: number;
  invoke_arg?: {
    tx_sent?: {
      time?: string;
      status_info?: string;
    };
  };
  input_coins: TradeIntentionCoin[];
  output_coins: TradeIntentionCoin[];
}

export interface TradesResponse {
  success: boolean;
  data: {
    intentions: TradeIntention[];
    total: number;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
  };
}

export interface UseTradesOptions {
  poolAddress: string | undefined;
  initiator?: string;
  limit?: number;
  offset?: number;
  sortBy?: "time" | "value";
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

export function useTrades(options: UseTradesOptions) {
  const {
    poolAddress,
    initiator,
    limit = 20,
    offset = 0,
    sortBy = "time",
    sortOrder = "desc",
    enabled = true,
  } = options;

  return useQuery({
    enabled: enabled && !!poolAddress,
    queryKey: ["trades", poolAddress, initiator, limit, offset, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        poolAddress: poolAddress!,
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
      });

      if (initiator) {
        params.set("initiator", initiator);
      }

      const { data } = await axios.get<TradesResponse>(`/api/trades?${params}`);

      if (!data.success) {
        throw new Error("Failed to fetch trades");
      }

      return data.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

