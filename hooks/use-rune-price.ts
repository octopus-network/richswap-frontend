import { useState, useEffect, useCallback } from "react";

export interface RunePriceData {
  price: number;
  market_cap: number;
  tvl: number;
  change: number;
  hasData: boolean;
  timestamp?: number;
  fallback?: boolean;
}

interface UseRunePriceReturn {
  priceData: RunePriceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRunePrice(
  runeName: string | null,
  options?: {
    refreshInterval?: number;
    enabled?: boolean;
  }
): UseRunePriceReturn {
  const [priceData, setPriceData] = useState<RunePriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshInterval = 30000, enabled = true } = options || {};

  const fetchPrice = useCallback(async () => {
    if (!runeName || !enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/rune-price?rune=${encodeURIComponent(runeName)}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch price");
      }

      if (result.success) {
        const newPriceData: RunePriceData = {
          price: result.data.price,
          market_cap: result.data.market_cap,
          tvl: result.data.tvl,
          change: result.data.change,
          hasData: result.data.hasData,
          timestamp: result.data.timestamp,
          fallback: result.data.fallback,
        };

        setPriceData(newPriceData);
      } else {
        throw new Error(result.error || "API returned unsuccessful response");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[useRunePrice] Error fetching price:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [runeName, enabled]);

  useEffect(() => {
    if (runeName && enabled) {
      fetchPrice();
    }
  }, [runeName, enabled, fetchPrice]);

  useEffect(() => {
    if (!runeName || !enabled || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      console.log(`[useRunePrice] Auto-refreshing price for ${runeName}`);
      fetchPrice();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      console.log(`[useRunePrice] Cleared refresh interval for ${runeName}`);
    };
  }, [runeName, enabled, refreshInterval, fetchPrice]);

  useEffect(() => {
    setPriceData(null);
    setError(null);
    setLoading(false);
  }, [runeName]);

  return {
    priceData,
    loading,
    error,
    refetch: fetchPrice,
  };
}
