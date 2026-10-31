import { formatEur, formatPercent } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";

/** Thin stacked bar showing which ETFs a value comes from. */
export function FundMixBar({
  byFund,
  funds,
}: {
  byFund: Record<string, number>;
  funds: FundSeries[];
}) {
  const total = Object.values(byFund).reduce((sum, value) => sum + value, 0);
  const title = funds
    .filter((fund) => byFund[fund.isin])
    .map(
      (fund) =>
        `${fund.label}: ${formatEur(byFund[fund.isin]!)} (${formatPercent(byFund[fund.isin]! / total)})`,
    )
    .join("\n");

  return (
    <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-muted" title={title}>
      {funds.map((fund) =>
        byFund[fund.isin] ? (
          <div
            key={fund.isin}
            style={{ width: `${(byFund[fund.isin]! / total) * 100}%`, background: fund.color }}
          />
        ) : null,
      )}
    </div>
  );
}

export function FundLegend({ funds }: { funds: FundSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {funds.map((fund) => (
        <li key={fund.isin} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px]" style={{ background: fund.color }} />
          {fund.label}
        </li>
      ))}
    </ul>
  );
}
