import { NextRequest, NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";

export const dynamic = "force-dynamic";

function resolutionToSeconds(res: string) {
  const map: Record<string, number> = {
    "15": 900,
    "60": 3600,
    "240": 14400,
    "1D": 86400,
  };
  return map[res] || 900;
}

export async function GET(req: NextRequest) {
  try {
    const rune = req.nextUrl.searchParams.get("rune");
    const resolution = req.nextUrl.searchParams.get("resolution");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    if (!rune || !resolution || !from || !to) {
      throw new Error("Missing parameter(s)");
    }

    const client = new GraphQLClient(
      "https://ree-hasura-mainnet.omnity.network/v1/graphql",
      {
        fetch: (url: RequestInfo | URL, options: RequestInit | undefined) =>
          fetch(url as string, {
            ...options,
            cache: "no-store",
          }),
      }
    );

    const query = gql`
      query GetKlineByToken($token: String!) {
        k_line_minutes(where: { token: { _eq: $token } }) {
          high
          low
          open
          close
          volume
          timestamp
        }
      }
    `;

    const { k_line_minutes: raw } = (await client.request(query, {
      token: rune,
    })) as {
      k_line_minutes: {
        high: string;
        low: string;
        open: string;
        close: string;
        volume: number;
        timestamp: number;
      }[];
    };

    const items = (raw ?? []).map((d) => ({
      ...d,
      timestamp: Math.floor(Number(d.timestamp) / 1e9),
    }));

    const fromTs = Number(from);
    const toTs = Number(to);

    let result: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[] = [];

    if (resolution === "15") {
      result = items
        .filter((item) => item.timestamp >= fromTs && item.timestamp <= toTs)
        .map((d) => ({
          time: d.timestamp * 1000,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close),
          volume: Number(d.volume),
        }))
        .sort((a, b) => a.time - b.time);
    } else {
      const interval = resolutionToSeconds(resolution);
      const grouped = new Map<number, any>();

      for (const item of items) {
        const { timestamp, open, high, low, close, volume } = item;
        if (timestamp < fromTs || timestamp > toTs) continue;

        const bucket = Math.floor(timestamp / interval) * interval;

        if (!grouped.has(bucket)) {
          grouped.set(bucket, {
            time: bucket * 1000,
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume),
          });
        } else {
          const g = grouped.get(bucket);
          g.high = Math.max(g.high, Number(high));
          g.low = Math.min(g.low, Number(low));
          g.close = Number(close);
          g.volume += Number(volume);
        }
      }

      result = Array.from(grouped.values()).sort((a, b) => a.time - b.time);

      for (let i = 1; i < result.length; i++) {
        result[i].open = result[i - 1].close;
      }
    }

    const currPrice = result.length > 0 ? result[result.length - 1].close : 0;

    const twentyFourHoursAgoTs = toTs - 86400;

    const price24hAgoBar = [...result]
      .reverse()
      .find((bar) => bar.time <= twentyFourHoursAgoTs * 1000);

    let change = 0;
    if (price24hAgoBar) {
      change =
        ((currPrice - price24hAgoBar.close) / price24hAgoBar.close) * 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        bars: result,
        price: currPrice,
        change,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unknown Error",
      success: false,
    });
  }
}
