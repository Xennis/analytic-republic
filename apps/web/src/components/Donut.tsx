import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatEur, formatPercent } from "@/lib/format";

export type Slice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: Slice[];
  /** Reference for the percentages in the tooltip. */
  total: number;
  centerLabel: string;
  centerValue: string;
  onSliceClick?: (slice: Slice) => void;
};

/** Donut chart with a value in the middle, built on the shadcn chart container. */
export function Donut({ slices, total, centerLabel, centerValue, onSliceClick }: Props) {
  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [slice.id, { label: slice.label, color: slice.color }]),
  );

  return (
    <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-72">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="id"
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: (item.payload as Slice).color }}
                  />
                  <span className="text-muted-foreground">{(item.payload as Slice).label}</span>
                  <span className="ml-auto pl-2 font-mono font-medium tabular-nums">
                    {formatEur(Number(value))} · {formatPercent(Number(value) / total)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={slices}
          dataKey="value"
          nameKey="id"
          innerRadius="62%"
          outerRadius="95%"
          paddingAngle={slices.length > 1 ? 1 : 0}
          stroke="var(--background)"
          strokeWidth={2}
          isAnimationActive={false}
          onClick={(_, index) => {
            const slice = slices[index];
            if (slice && onSliceClick) onSliceClick(slice);
          }}
          className={onSliceClick ? "cursor-pointer" : undefined}
        >
          {slices.map((slice) => (
            <Cell key={slice.id} fill={slice.color} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              const { cx, cy } = viewBox;
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan
                    x={cx}
                    y={(cy ?? 0) - 10}
                    className="fill-foreground text-lg font-semibold"
                  >
                    {centerValue}
                  </tspan>
                  <tspan x={cx} y={(cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                    {centerLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
