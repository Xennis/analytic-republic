import {
  compareShares,
  countryLabel,
  coverage,
  REGION_LABELS,
  regionOf,
  regionShares,
  type RegionId,
  type ShareComparison,
  type Shares,
} from "@analytic-republic/portfolio";
import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPARISON_COLORS } from "@/lib/colors";
import { formatDate, formatPercent } from "@/lib/format";
import type { WorldBenchmarks } from "@/lib/portfolio";
import {
  ComparisonBars,
  ComparisonLegend,
  type ComparisonRow,
  type ComparisonSeries,
} from "./ComparisonBars";

const COUNTRY_COUNT = 15;
const OTHER_ID = "__other";

type GdpKind = "nominal" | "ppp";

const GDP_LABELS: Record<GdpKind, string> = { nominal: "BIP nominal", ppp: "BIP KKP" };

type Benchmark = { series: ComparisonSeries; shares: Shares; source: string };

type Props = {
  /** Country shares of the equities in the portfolio. */
  countries: Shares;
  benchmarks: WorldBenchmarks;
};

function only(shares: Shares, region: RegionId): Shares {
  return Object.fromEntries(
    Object.entries(shares).filter(([country]) => regionOf(country) === region),
  );
}

/** Rows of the largest countries plus one for the rest, so that the region adds up. */
function countryRows(comparisons: ShareComparison[]): ComparisonRow[] {
  const rows: ComparisonRow[] = comparisons.map((comparison) => ({
    id: comparison.id,
    label: countryLabel(comparison.id),
    values: [comparison.portfolio, ...comparison.benchmarks],
  }));
  const rest = rows.splice(COUNTRY_COUNT);
  if (rest.length > 0) {
    rows.push({
      id: OTHER_ID,
      label: `Übrige (${rest.length})`,
      values: rest[0]!.values.map((_, index) =>
        rest.reduce((sum, row) => sum + row.values[index]!, 0),
      ),
    });
  }
  return rows;
}

/** Portfolio by region and country next to world GDP and the world equity market. */
export function WorldComparison({ countries, benchmarks }: Props) {
  const [gdpKind, setGdpKind] = useState<GdpKind>("nominal");
  const [region, setRegion] = useState<RegionId>();

  const { gdp, market } = benchmarks;
  const used: Benchmark[] = [];
  if (gdp) {
    used.push({
      series: { label: GDP_LABELS[gdpKind], color: COMPARISON_COLORS.gdp },
      shares: gdp[gdpKind],
      source: `IWF World Economic Outlook, BIP ${gdp.year}`,
    });
  }
  if (market) {
    used.push({
      series: { label: "Weltaktienmarkt", color: COMPARISON_COLORS.market },
      shares: market.countries,
      source: `${market.name}, Positionen vom ${formatDate(market.asOf)}`,
    });
  }
  const series: ComparisonSeries[] = [
    { label: "Portfolio", color: COMPARISON_COLORS.portfolio },
    ...used.map((benchmark) => benchmark.series),
  ];

  const rows: ComparisonRow[] = region
    ? countryRows(
        compareShares(
          only(countries, region),
          used.map((benchmark) => only(benchmark.shares, region)),
        ),
      )
    : compareShares(
        regionShares(countries),
        used.map((benchmark) => regionShares(benchmark.shares)),
      ).map((comparison) => ({
        id: comparison.id,
        label: REGION_LABELS[comparison.id as RegionId],
        values: [comparison.portfolio, ...comparison.benchmarks],
        clickable: true,
      }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio vs. Weltwirtschaft</CardTitle>
        <CardDescription>
          In Prozent der Aktien im Depot, ohne Cash.{" "}
          {region
            ? "Länder der Region, in Prozent der ganzen Welt."
            : "Klicke auf eine Region, um ihre Länder zu sehen."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {used.map((benchmark) => (
            <div key={benchmark.source} className="flex flex-col gap-0.5 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">
                Abdeckung {benchmark.series.label}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatPercent(coverage(countries, benchmark.shares))}
              </span>
              <span className="text-xs text-muted-foreground">{benchmark.source}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Die Abdeckung zeigt, welcher Teil des Portfolios in denselben Ländern liegt wie der
          Maßstab: 100 % bei gleicher Verteilung, 0 % ohne jede Überschneidung.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {region ? (
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={() => setRegion(undefined)}>
                      Welt
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Welt</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {region && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{REGION_LABELS[region]}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {gdp && (
            <div className="flex gap-1" role="group" aria-label="BIP-Maßstab">
              {(Object.keys(GDP_LABELS) as GdpKind[]).map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant={kind === gdpKind ? "secondary" : "ghost"}
                  aria-pressed={kind === gdpKind}
                  onClick={() => setGdpKind(kind)}
                >
                  {GDP_LABELS[kind]}
                </Button>
              ))}
            </div>
          )}
        </div>

        <ComparisonLegend series={series} />
        <ComparisonBars
          rows={rows}
          series={series}
          onRowClick={(row) => setRegion(row.id as RegionId)}
        />
        <Explanation />
      </CardContent>
    </Card>
  );
}

function Explanation() {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <Info className="size-3.5" aria-hidden />
        Warum weicht das Portfolio so stark vom BIP ab?
      </summary>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 rounded-lg border p-3 pl-7">
        <li>
          Aktien-ETFs gewichten nach Börsenwert, nicht nach Wirtschaftsleistung. US-Unternehmen sind
          hoch bewertet und sehr profitabel, deshalb wiegen sie im Index weit mehr als die USA im
          BIP.
        </li>
        <li>
          Nicht jede Wirtschaft ist an der Börse: Staat, Mittelstand und Familienunternehmen zählen
          zum BIP, aber nicht zum Index.
        </li>
        <li>
          Nicht alles Börsennotierte ist investierbar. Chinesische A-Aktien zählen nur teilweise,
          Russland ist seit 2022 ausgeschlossen.
        </li>
        <li>
          Das Land ist der Sitz des Unternehmens, nicht der Ort seiner Umsätze. Große US-Konzerne
          verdienen viel im Ausland, wirtschaftlich ist das Portfolio daher breiter gestreut, als es
          hier aussieht.
        </li>
        <li>
          Der Weltaktienmarkt zeigt, was ein neutrales Weltportfolio hält. Liegt das Portfolio nah
          an ihm, ist die Abweichung vom BIP gewollt.
        </li>
      </ul>
    </details>
  );
}
