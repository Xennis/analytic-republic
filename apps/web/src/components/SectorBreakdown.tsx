import type { BreakdownNode } from "@analytic-republic/portfolio";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";
import { FundStackedBars } from "./FundStackedBars";

const COMPANY_COUNT = 15;

type Props = {
  root: BreakdownNode;
  funds: FundSeries[];
  total: number;
};

/** Sectors as stacked bars; a click on a sector shows its largest companies. */
export function SectorBreakdown({ root, funds, total }: Props) {
  const [selectedId, setSelectedId] = useState<string>();
  const selected = root.children.find((sector) => sector.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sektoren</CardTitle>
        <CardDescription>
          {selected
            ? "Größte Unternehmen des Sektors, in Prozent vom Depot."
            : "In Prozent vom Depot. Klicke auf einen Sektor, um seine Unternehmen zu sehen."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {selected ? (
                <BreadcrumbLink asChild>
                  <button type="button" onClick={() => setSelectedId(undefined)}>
                    {root.label}
                  </button>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{root.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {selected && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage title={selected.fullLabel}>{selected.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {selected ? (
          <>
            <FundStackedBars
              key={selected.id}
              rows={selected.children.slice(0, COMPANY_COUNT)}
              funds={funds}
              total={total}
              parent={selected}
            />
            <p className="text-xs text-muted-foreground">
              Zeigt {Math.min(COMPANY_COUNT, selected.children.length)} von{" "}
              {selected.children.length.toLocaleString("de-DE")} Positionen im Sektor (zusammen{" "}
              {formatPercent(selected.value / total)} vom Depot).
            </p>
          </>
        ) : (
          <FundStackedBars
            rows={root.children}
            funds={funds}
            total={total}
            labelWidth={110}
            onRowClick={(sector) => setSelectedId(sector.id)}
          />
        )}
      </CardContent>
    </Card>
  );
}
