import { countryLabel, type BreakdownNode } from "@analytic-republic/portfolio";
import { Search } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEur, formatPercent } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";
import { FundMixBar } from "./FundMix";

const CHART_COUNT = 15;
const TABLE_LIMIT = 100;

type Props = {
  companies: BreakdownNode[];
  funds: FundSeries[];
  total: number;
};

/** Largest companies across all ETFs: stacked bars by fund plus a searchable table. */
export function TopCompanies({ companies, funds, total }: Props) {
  const [query, setQuery] = useState("");

  // Chart keys must be valid CSS identifiers, ISINs are.
  const config: ChartConfig = Object.fromEntries(
    funds.map((fund) => [fund.isin, { label: fund.label, color: fund.color }]),
  );
  const data = companies.slice(0, CHART_COUNT).map((company) => ({
    label: company.label,
    ...company.byFund,
  }));

  const ranked = companies.map((company, index) => ({ company, rank: index + 1 }));
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? ranked.filter(({ company }) => company.label.toLowerCase().includes(needle))
    : ranked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Größte Unternehmen</CardTitle>
        <CardDescription>
          Über alle ETFs zusammengerechnet, Aktiengattungen eines Unternehmens zusammengefasst
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ChartContainer config={config} className="aspect-auto h-[34rem] w-full">
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

        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${companies.length.toLocaleString("de-DE")} Unternehmen durchsuchen`}
              className="pl-8"
              aria-label="Unternehmen suchen"
            />
          </div>
          <div className="max-h-[32rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-12 text-right">#</TableHead>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                  <TableHead className="text-right">Anteil</TableHead>
                  <TableHead className="w-40">Aus ETFs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.slice(0, TABLE_LIMIT).map(({ company, rank }) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {rank}
                    </TableCell>
                    <TableCell className="font-medium">{company.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {countryLabel(company.country)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEur(company.value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(company.value / total)}
                    </TableCell>
                    <TableCell>
                      <FundMixBar byFund={company.byFund} funds={funds} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            {matches.length > TABLE_LIMIT
              ? `Zeigt die ersten ${TABLE_LIMIT} von ${matches.length.toLocaleString("de-DE")} Treffern.`
              : `${matches.length.toLocaleString("de-DE")} Treffer.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
