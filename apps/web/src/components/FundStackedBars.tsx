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
import { formatEur, formatPercent } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";

/** Room per bar plus space for the axis and the legend. */
const ROW_HEIGHT_REM = 2.1;
const CHROME_HEIGHT_REM = 4;

const axisPercent = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 1,
});

type Row = { node: BreakdownNode; label: string } & Record<string, unknown>;

type Props = {
  rows: BreakdownNode[];
  funds: FundSeries[];
  /** Portfolio value; bars show the share of it. */
  total: number;
  /** When the rows are part of a group, the tooltip also shows the share of it. */
  parent?: BreakdownNode;
};

/** Horizontal bars in percent of the portfolio, stacked by the ETFs the value comes from. */
export function FundStackedBars({ rows, funds, total, parent }: Props) {
  // Chart keys must be valid CSS identifiers, ISINs are.
  const config: ChartConfig = Object.fromEntries(
    funds.map((fund) => [fund.isin, { label: fund.label, color: fund.color }]),
  );
  const data: Row[] = rows.map((node) => ({
    node,
    label: node.label,
    ...Object.fromEntries(
      Object.entries(node.byFund).map(([isin, value]) => [isin, value / total]),
    ),
  }));

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: `${rows.length * ROW_HEIGHT_REM + CHROME_HEIGHT_REM}rem` }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value: number) => axisPercent.format(value)}
          tickLine={false}
          axisLine={false}
        />
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
              labelFormatter={(_, payload) => {
                const node = (payload[0]?.payload as Row | undefined)?.node;
                if (!node) return null;
                return (
                  <div className="flex flex-col gap-0.5">
                    <span>{node.fullLabel ?? node.label}</span>
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {formatPercent(node.value / total)} vom Depot · {formatEur(node.value)}
                      {parent &&
                        ` · ${formatPercent(node.value / parent.value)} von ${parent.label}`}
                    </span>
                  </div>
                );
              }}
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: `var(--color-${String(name)})` }}
                  />
                  <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                  <span className="ml-auto pl-2 font-mono font-medium tabular-nums">
                    {formatPercent(Number(value))}
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
