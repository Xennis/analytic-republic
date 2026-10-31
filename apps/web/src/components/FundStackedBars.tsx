import type { BreakdownNode } from "@analytic-republic/portfolio";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatEur } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";

/** Room per bar plus space for the axis and the legend. */
const ROW_HEIGHT_REM = 2.1;
const CHROME_HEIGHT_REM = 4;

type Props = {
  rows: BreakdownNode[];
  funds: FundSeries[];
};

/** Horizontal bars, one per node, stacked by the ETFs the value comes from. */
export function FundStackedBars({ rows, funds }: Props) {
  // Chart keys must be valid CSS identifiers, ISINs are.
  const config: ChartConfig = Object.fromEntries(
    funds.map((fund) => [fund.isin, { label: fund.label, color: fund.color }]),
  );
  const data = rows.map((row) => ({ label: row.label, ...row.byFund }));

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: `${rows.length * ROW_HEIGHT_REM + CHROME_HEIGHT_REM}rem` }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickFormatter={formatEur} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={190}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: `var(--color-${String(name)})` }}
                  />
                  <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                  <span className="ml-auto pl-2 font-mono font-medium tabular-nums">
                    {formatEur(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {funds.map((fund) => (
          <Bar
            key={fund.isin}
            dataKey={fund.isin}
            stackId="funds"
            fill={`var(--color-${fund.isin})`}
            stroke="var(--background)"
            strokeWidth={1}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
