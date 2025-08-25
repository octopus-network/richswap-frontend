import { NextRequest, NextResponse } from "next/server";
import { gql, GraphQLClient } from "graphql-request";

export const dynamic = "force-dynamic";

function resolutionToMinutes(res: string) {
  const map: Record<string, number> = {
    "1": 1,
    "15": 15,
    "60": 60,
    "240": 240,
    "1D": 1440,
  };
  return map[res] || 15;
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
      query GetKlineByToken($token: String!, $fromTs: bigint!, $toTs: bigint!) {
        k_line_minutes(
          where: {
            token: { _eq: $token }
            timestamp: { _gte: $fromTs, _lte: $toTs }
          }
          order_by: { timestamp: asc }
        ) {
          high
          low
          open
          close
          volume
          timestamp
        }
      }
    `;

    const fromTs = Number(from) * 1e9;
    const toTs = Number(to) * 1e9;

    const { k_line_minutes: raw } = (await client.request(query, {
      token: rune,
      fromTs: fromTs.toString(),
      toTs: toTs.toString(),
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

    const toTsSeconds = Number(to);

    let result: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[] = [];

    const intervalMinutes = resolutionToMinutes(resolution);

    if (intervalMinutes === 1) {
      result = items.map((d) => ({
        time: d.timestamp * 1000,
        open: Number(d.open),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
        volume: Number(d.volume),
      }));
    } else {
      const intervalSeconds = intervalMinutes * 60;

      const grouped = new Map<
        number,
        {
          time: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
          firstTimestamp: number;
          lastTimestamp: number;
          dataPoints: Array<{
            timestamp: number;
            open: string;
            high: string;
            low: string;
            close: string;
            volume: number;
          }>;
        }
      >();

      let bucketCount = 0;
      for (const item of items) {
        const { timestamp, open, high, low, close, volume } = item;

        const bucket =
          Math.floor(timestamp / intervalSeconds) * intervalSeconds;

        if (bucketCount < 5) {
          bucketCount++;
        }

        if (!grouped.has(bucket)) {
          grouped.set(bucket, {
            time: bucket * 1000,
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume),
            firstTimestamp: timestamp,
            lastTimestamp: timestamp,
            dataPoints: [{ timestamp, open, high, low, close, volume }],
          });
        } else {
          const g = grouped.get(bucket)!;

          g.dataPoints.push({ timestamp, open, high, low, close, volume });

          g.dataPoints.sort((a, b) => a.timestamp - b.timestamp);

          const firstPoint = g.dataPoints[0];
          const lastPoint = g.dataPoints[g.dataPoints.length - 1];

          g.open = Number(firstPoint.open);
          g.close = Number(lastPoint.close);
          g.high = Math.max(...g.dataPoints.map((p) => Number(p.high)));
          g.low = Math.min(...g.dataPoints.map((p) => Number(p.low)));
          g.volume = g.dataPoints.reduce((sum, p) => sum + Number(p.volume), 0);
          g.firstTimestamp = firstPoint.timestamp;
          g.lastTimestamp = lastPoint.timestamp;
        }
      }

      result = Array.from(grouped.values())
        .map((item) => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }))
        .sort((a, b) => a.time - b.time);
    }

    const currPrice = result.length > 0 ? result[result.length - 1].close : 0;

    let change = 0;
    if (result.length > 0) {
      const twentyFourHoursAgoTs = toTsSeconds - 86400;

      const price24hAgoBar = result.find(
        (bar) => bar.time >= twentyFourHoursAgoTs * 1000
      );

      if (price24hAgoBar && price24hAgoBar.close > 0) {
        change =
          ((currPrice - price24hAgoBar.close) / price24hAgoBar.close) * 100;
      } else if (result.length > 0 && result[0].close > 0) {
        change = ((currPrice - result[0].close) / result[0].close) * 100;
      }
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
