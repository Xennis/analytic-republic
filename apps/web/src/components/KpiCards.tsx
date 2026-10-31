import type { Totals } from "@analytic-republic/portfolio";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEur, formatSignedEur, formatSignedPercent } from "@/lib/format";

type Props = {
  totals: Totals;
  companyCount: number;
};

export function KpiCards({ totals, companyCount }: Props) {
  const gainShare = totals.costBasis > 0 ? totals.gain / totals.costBasis : 0;
  const tiles = [
    { label: "Marktwert", value: formatEur(totals.marketValue) },
    { label: "Einstandswert", value: formatEur(totals.costBasis) },
    {
      label: "Gewinn / Verlust",
      value: formatSignedEur(totals.gain),
      detail: formatSignedPercent(gainShare),
    },
    { label: "Unternehmen", value: companyCount.toLocaleString("de-DE"), detail: "durchgerechnet" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{tile.value}</CardTitle>
            {tile.detail && (
              <CardDescription className="tabular-nums">{tile.detail}</CardDescription>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
