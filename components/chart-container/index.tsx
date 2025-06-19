import { useEffect, useRef } from "react";
import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
  DatafeedConfiguration,
  widget,
  IBasicDataFeed,
  LibrarySymbolInfo,
} from "@/public/static/charting_library";

import { useMemo } from "react";
import axios from "axios";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: ["15", "1H", "4H", "1D", "1W"] as ResolutionString[],
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

export const ChartContainer = ({
  symbol,
  onReady,
}: {
  symbol: string;
  onReady: (price: { price: number; change: number } | null) => void;
}) => {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

  const dataRangeRef = useRef<{ min: number; max: number } | null>(null);
  const latestPriceRef = useRef<{ price: number; change: number } | null>(null);

  const datafeed: IBasicDataFeed = useMemo(
    () => {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(localTz);
      return {
        onReady: (callback) => {
          setTimeout(() => callback(configurationData));
        },
        searchSymbols: () => {},
        resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
          const symbol = `${symbolName}`;
          const symbolInfo: LibrarySymbolInfo = {
            ticker: symbol,
            name: symbol,
            description: symbol,
            pricescale: 1000000,
            minmov: 1,
            exchange: "RichSwap",
            listed_exchange: "",
            session: "24x7",
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: false,
            timezone: localTz as any,
            type: "crypto",
            supported_resolutions: configurationData.supported_resolutions,
            format: "price",
          };
          onSymbolResolvedCallback(symbolInfo);
        },
        getBars: async (
          symbolInfo,
          resolution,
          periodParams,
          onHistoryCallback,
          onErrorCallback
        ) => {
          const { from, to } = periodParams;
          try {
            const { data } = await axios
              .get<{
                data: {
                  bars: {
                    open: number;
                    high: number;
                    low: number;
                    close: number;
                    volume: number;
                    time: number;
                  }[];
                  price: number;
                  change: number;
                };
              }>(
                `/api/kline?rune=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`
              )
              .then((res) => res.data);

            const times = data.bars.map((d) => d.time);
            const min = Math.min(...times);
            const max = Math.max(...times);
            dataRangeRef.current = { min, max };

            if (!latestPriceRef.current) {
              latestPriceRef.current = {
                price: data.price,
                change: data.change,
              };
            }

            onHistoryCallback(data.bars, {
              noData: data.bars.length === 0,
            });
          } catch (e) {
            if (e instanceof Error) {
              console.warn("[getBars]: Get error", e);
              onErrorCallback(e.message);
            }
          }
        },
        subscribeBars: async () => {},
        unsubscribeBars: async () => {},
      };
    },
    [symbol] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    latestPriceRef.current = null;
  }, [symbol]);

  useEffect(() => {
    if (!symbol) {
      return;
    }
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      // BEWARE: no trailing slash is expected in feed URL
      datafeed,
      interval: "1H" as ResolutionString,
      container: chartContainerRef.current,
      library_path: "/static/charting_library/",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "control_bar",
        "study_templates",
        "snapshot_trading_drawings",
        "timeframes_toolbar",
        "header_symbol_search",
        "header_compare",
        "display_market_status",
        "symbol_info",
        "header_undo_redo",
        "header_saveload",
      ],
      overrides: {
        "paneProperties.background": "#1f242a",
        "paneProperties.horzGridProperties.color": "rgba(150, 150, 160, .1)",
        "paneProperties.vertGridProperties.color": "rgba(150, 150, 160, .1)",
        "scalesProperties.textColor": "#bec0c9",
        "paneProperties.legendProperties.showSeriesTitle": false,
        "paneProperties.legendProperties.showVolume": true,
        "paneProperties.legendProperties.showBarChange": false,
        "mainSeriesProperties.statusViewStyle.showExchange": false,
        "mainSeriesProperties.statusViewStyle.showInterval": false,
        "mainSeriesProperties.statusViewStyle.symbolTextSource": "description",
        "mainSeriesProperties.candleStyle.upColor": "#459782",
        "mainSeriesProperties.candleStyle.downColor": "#df484c",
        "mainSeriesProperties.candleStyle.borderUpColor": "#459782",
        "mainSeriesProperties.candleStyle.borderDownColor": "#df484c",
        "mainSeriesProperties.candleStyle.wickUpColor": "#459782",
        "mainSeriesProperties.candleStyle.wickDownColor": "#df484c",
        volumePaneSize: "medium",
      },
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      autosize: true,
      custom_css_url: "/static/tv-custom.css",
      loading_screen: {
        backgroundColor: "#23282f",
        foregroundColor: "transparent",
      },
    };

    const tvWidget = new widget(widgetOptions);

    tvWidget.onChartReady(() => {
      const chart = tvWidget.activeChart();
      const range = dataRangeRef.current;
      const latestPrice = latestPriceRef.current;

      if (range) {
        chart.setVisibleRange({
          from: range.min,
          to: range.max,
        });
      }

      setTimeout(() => {
        onReady(latestPrice);
      }, 500);
    });

    return () => {
      tvWidget.remove();
    };

    // eslint-disable-next-line
  }, [symbol, datafeed]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
