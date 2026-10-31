import { ChevronRight } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ComparisonSeries = { label: string; color: string };

export type ComparisonRow = {
  id: string;
  label: string;
  fullLabel?: string;
  /** Share per series, in the order of the series. */
  values: number[];
  clickable?: boolean;
};

type Props = {
  rows: ComparisonRow[];
  series: ComparisonSeries[];
  onRowClick?: (row: ComparisonRow) => void;
};

export function ComparisonLegend({ series }: { series: ComparisonSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** One bar per series and row, all on the same scale so that rows can be compared. */
export function ComparisonBars({ rows, series, onRowClick }: Props) {
  const max = Math.max(...rows.flatMap((row) => row.values), 0);

  return (
    <ul className="divide-y rounded-lg border">
      {rows.map((row) => {
        const clickable = Boolean(onRowClick && row.clickable);
        const Row = clickable ? "button" : "div";
        return (
          <li key={row.id}>
            <Row
              {...(clickable ? { type: "button" as const, onClick: () => onRowClick!(row) } : {})}
              className={cn(
                "grid w-full grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-x-3 px-3 py-2 text-left text-sm",
                clickable && "hover:bg-muted/60",
              )}
            >
              <span className="truncate font-medium" title={row.fullLabel ?? row.label}>
                {row.label}
              </span>
              <div className="flex flex-col gap-1">
                {series.map((item, index) => {
                  const value = row.values[index] ?? 0;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2"
                      title={`${item.label}: ${formatPercent(value)}`}
                    >
                      <div className="h-2 flex-1">
                        <div
                          className="h-full rounded-[2px]"
                          style={{
                            width: max > 0 ? `${(value / max) * 100}%` : 0,
                            background: item.color,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                        {formatPercent(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ChevronRight
                className={cn("size-4 text-muted-foreground", !clickable && "invisible")}
                aria-hidden
              />
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
