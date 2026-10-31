import { countryLabel, sectorLabel, type BreakdownNode } from "@analytic-republic/portfolio";
import { Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FundStackedBars } from "./FundStackedBars";

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

  const ranked = companies.map((company, index) => ({ company, rank: index + 1 }));
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? ranked.filter(({ company }) => {
        const sector = sectorLabel(company.sector);
        return [company.label, sector.short, sector.full].some((text) =>
          text.toLowerCase().includes(needle),
        );
      })
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
        <FundStackedBars rows={companies.slice(0, CHART_COUNT)} funds={funds} total={total} />

        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Unternehmen oder Sektor suchen"
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
                  <TableHead>Sektor</TableHead>
                  <TableHead className="text-right">Anteil</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
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
                    <TableCell
                      className="text-muted-foreground"
                      title={sectorLabel(company.sector).full}
                    >
                      {sectorLabel(company.sector).short}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(company.value / total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatEur(company.value)}
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
