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
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
};

export const ChartContainer = ({
  symbol,
  onLoadingChange,
}: {
  symbol: string;
  onLoadingChange?: (loading: boolean) => void;
}) => {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

  const dataRangeRef = useRef<{ min: number; max: number } | null>(null);
  const latestTimeRef = useRef<number>(0);

  const datafeed: IBasicDataFeed = useMemo(
    () => {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
            volume_precision: 2,
            intraday_multipliers: ["15"],
            daily_multipliers: ["1"],
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
          const { from, to, firstDataRequest } = periodParams;

          try {
            let apiUrl;
            if (firstDataRequest) {
              const now = Math.floor(Date.now() / 1000);
              const sixMonthsAgo = now - 180 * 24 * 60 * 60;
              apiUrl = `/api/kline?rune=${symbolInfo.name}&resolution=${resolution}&from=${sixMonthsAgo}&to=${now}`;
            } else {
              apiUrl = `/api/kline?rune=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`;
            }

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
              }>(apiUrl)
              .then((res) => res.data);

            if (data.bars.length > 0) {
              const times = data.bars.map((d) => d.time);
              const min = Math.min(...times);
              const max = Math.max(...times);

              if (dataRangeRef.current) {
                dataRangeRef.current = {
                  min: Math.min(dataRangeRef.current.min, min),
                  max: Math.max(dataRangeRef.current.max, max),
                };
              } else {
                dataRangeRef.current = { min, max };
              }

              if (times[times.length - 1] > latestTimeRef.current) {
                latestTimeRef.current = max;
              }
            }

            const meta: any = {
              noData: data.bars.length === 0,
            };

            if (firstDataRequest && data.bars.length > 0) {
              const earliestTime = Math.min(
                ...data.bars.map((bar) => bar.time)
              );

              meta.nextTime = earliestTime;
            }

            onHistoryCallback(data.bars, meta);
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
    latestTimeRef.current = 0;
  }, [symbol]);

  useEffect(() => {
    if (!symbol) {
      return;
    }
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      datafeed,
      interval: "1H" as ResolutionString,
      container: chartContainerRef.current,
      library_path: "/static/charting_library/",
      locale: "en",
      time_frames: [
        {
          text: "1M",
          resolution: "15" as ResolutionString,
          description: "1 Month",
        },
        {
          text: "3M",
          resolution: "15" as ResolutionString,
          description: "3 Months",
        },
        {
          text: "6M",
          resolution: "1H" as ResolutionString,
          description: "6 Months",
        },
        {
          text: "1Y",
          resolution: "1D" as ResolutionString,
          description: "1 Year",
        },
      ],
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

    if (onLoadingChange) {
      onLoadingChange(true);
    }

    tvWidget.onChartReady(() => {
      const chart = tvWidget.activeChart();

      chart.onIntervalChanged().subscribe(null, () => {
        latestTimeRef.current = 0;
      });

      chart.onDataLoaded().subscribe(null, () => {
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      });
    });

    return () => {
      tvWidget.remove();
    };

    // eslint-disable-next-line
  }, [symbol, datafeed]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
