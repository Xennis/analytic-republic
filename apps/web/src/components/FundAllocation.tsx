import type { ValuedPosition } from "@analytic-republic/portfolio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatEur,
  formatPercent,
  formatShares,
  formatSignedEur,
  formatSignedPercent,
} from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Donut } from "./Donut";

type Props = {
  positions: ValuedPosition[];
  funds: FundSeries[];
  total: number;
};

export function FundAllocation({ positions, funds, total }: Props) {
  const seriesByIsin = new Map(funds.map((fund) => [fund.isin, fund]));
  const slices = funds.map((fund) => ({
    id: fund.isin,
    label: fund.label,
    value: positions.find((position) => position.isin === fund.isin)?.marketValue ?? 0,
    color: fund.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verteilung auf ETFs</CardTitle>
        <CardDescription>Marktwert zum letzten NAV, in Euro umgerechnet</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 lg:grid-cols-[18rem_1fr]">
        <Donut
          slices={slices}
          total={total}
          centerLabel="Marktwert"
          centerValue={formatEur(total)}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ETF</TableHead>
                <TableHead className="text-right">Anteile</TableHead>
                <TableHead className="text-right">Einstand</TableHead>
                <TableHead className="text-right">Marktwert</TableHead>
                <TableHead className="text-right">G/V</TableHead>
                <TableHead className="text-right">Anteil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const series = seriesByIsin.get(position.isin);
                const gain = position.gain;
                return (
                  <TableRow key={position.isin}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ background: series?.color ?? "var(--muted)" }}
                        />
                        <div>
                          <div className="font-medium">{series?.label ?? position.name}</div>
                          <div className="text-xs text-muted-foreground">{position.isin}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatShares(position.shares)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEur(position.costBasis)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {position.marketValue === undefined ? "–" : formatEur(position.marketValue)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        gain !== undefined && gain < 0 && "text-destructive",
                      )}
                    >
                      {gain === undefined ? (
                        "–"
                      ) : (
                        <>
                          {formatSignedEur(gain)}
                          <div className="text-xs text-muted-foreground">
                            {formatSignedPercent(gain / position.costBasis)}
                          </div>
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {position.marketValue === undefined
                        ? "–"
                        : formatPercent(position.marketValue / total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
