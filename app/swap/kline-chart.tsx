"use client";

import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from "@/public/static/charting_library/charting_library";
import dynamic from "next/dynamic";
import Script from "next/script";
import { useState } from "react";

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  symbol: "BTCUSD",
  interval: "1D" as ResolutionString,
  library_path: "/static/charting_library/",
  locale: "en",
  charts_storage_url: "https://saveload.tradingview.com",
  charts_storage_api_version: "1.1",
  client_id: "tradingview.com",
  user_id: "public_user_id",
  fullscreen: false,
  autosize: true,
};

const ChartContainer = dynamic(
  () =>
    import("@/components/chart-container").then((mod) => mod.ChartContainer),
  { ssr: false }
);

export function KlineChart() {
  const [isScriptReady, setIsScriptReady] = useState(false);
  return (
    <>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
      {isScriptReady && <ChartContainer {...defaultWidgetProps} />}
    </>
  );
}
