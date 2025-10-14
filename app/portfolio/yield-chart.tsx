import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { formatNumber } from "@/lib/utils";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function YieldChart({
  yieldSats,
  yieldValue,
  claimable,
}: {
  yieldSats: number;
  yieldValue: number;
  claimable: number;
}) {
  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(var(--chart-1))",
    },
    claimable: {
      label: "Claimable",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto w-[140px] aspect-21/7"
    >
      <RadialBarChart
        data={[
          {
            total: yieldSats,
            claimable: claimable,
          },
        ]}
        endAngle={180}
        innerRadius={38}
        outerRadius={50}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 4}
                      className="fill-foreground text-xs font-bold"
                    >
                      {formatNumber(yieldSats, true)} sats
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 12}
                      className="fill-muted-foreground text-xs"
                    >
                      ${formatNumber(yieldValue, true)}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="total"
          stackId="a"
          cornerRadius={5}
          fill="hsl(var(--chart-1))"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="claimable"
          fill="hsl(var(--chart-2))"
          stackId="a"
          cornerRadius={5}
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}
