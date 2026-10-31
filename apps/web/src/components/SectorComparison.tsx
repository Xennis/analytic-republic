import type { SectorId } from "@analytic-republic/etf-data";
import { compareShares, coverage, sectorLabel, type Shares } from "@analytic-republic/portfolio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPARISON_COLORS } from "@/lib/colors";
import { formatDate, formatPercent } from "@/lib/format";
import type { WorldBenchmarks } from "@/lib/portfolio";
import { ComparisonBars, ComparisonLegend, type ComparisonSeries } from "./ComparisonBars";

type Props = {
  /** Sector shares of the equities in the portfolio. */
  sectors: Shares;
  market: NonNullable<WorldBenchmarks["market"]>;
};

const SERIES: ComparisonSeries[] = [
  { label: "Portfolio", color: COMPARISON_COLORS.portfolio },
  { label: "Weltaktienmarkt", color: COMPARISON_COLORS.market },
];

/** Portfolio by sector next to the world equity market. */
export function SectorComparison({ sectors, market }: Props) {
  const rows = compareShares(sectors, [market.sectors]).map((comparison) => {
    const label = sectorLabel(comparison.id as SectorId);
    return {
      id: comparison.id,
      label: label.short,
      fullLabel: label.full,
      values: [comparison.portfolio, ...comparison.benchmarks],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sektoren vs. Weltaktienmarkt</CardTitle>
        <CardDescription>
          In Prozent der Aktien mit Sektor, ohne Cash und ohne ETFs im ETF.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 rounded-lg border p-3 sm:w-1/2">
          <span className="text-xs text-muted-foreground">Abdeckung Weltaktienmarkt</span>
          <span className="text-2xl font-semibold tabular-nums">
            {formatPercent(coverage(sectors, market.sectors))}
          </span>
          <span className="text-xs text-muted-foreground">
            {market.name}, Positionen vom {formatDate(market.asOf)}
          </span>
        </div>
        <ComparisonLegend series={SERIES} />
        <ComparisonBars rows={rows} series={SERIES} />
        <p className="text-xs text-muted-foreground">
          Ein Vergleich mit dem BIP fehlt bewusst: Die Wirtschaftsleistung ist nur grob nach
          Landwirtschaft, Industrie und Dienstleistungen aufgeteilt, und die Sektoren der Aktien
          lassen sich darauf nicht sauber abbilden.
        </p>
      </CardContent>
    </Card>
  );
}
