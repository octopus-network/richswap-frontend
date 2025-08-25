"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import { useState } from "react";

const ChartContainer = dynamic(
  () =>
    import("@/components/chart-container").then((mod) => mod.ChartContainer),
  { ssr: false }
);

export function KlineChart({
  rune,
  onLoadingChange,
}: {
  rune: string;
  onLoadingChange?: (loading: boolean) => void;
}) {
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
      {isScriptReady && <ChartContainer symbol={rune} onLoadingChange={onLoadingChange} />}
    </>
  );
}
