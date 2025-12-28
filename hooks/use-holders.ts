import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface HoldersResponse {
  success: boolean;
  data: {
    holders: number;
  };
}

export interface UseHoldersOptions {
  runeId: string | undefined;
  enabled?: boolean;
  refreshInterval?: number;
}

export function useHolders(options: UseHoldersOptions) {
  const { runeId, enabled = true, refreshInterval } = options;

  return useQuery({
    enabled: enabled && !!runeId,
    queryKey: ["holders", runeId],
    queryFn: async () => {
      const { data } = await axios.get<HoldersResponse>(
        `/api/holders?runeId=${encodeURIComponent(runeId!)}`
      );

      if (!data.success) {
        throw new Error("Failed to fetch holders");
      }

      return data.data.holders;
    },
    staleTime: 60 * 1000,
    refetchInterval: refreshInterval,
  });
}

