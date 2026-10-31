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

export type GroupTexts = {
  title: string;
  /** Description on the top level. */
  hint: string;
  /** Description once a group is open. */
  groupHint: string;
  /** E.g. "im Sektor", completes "… Positionen im Sektor". */
  inGroup: string;
  /** Plural of the groups, e.g. "Ländern", completes "Zeigt 15 von 40 Ländern". */
  groups: string;
};

type Props = {
  root: BreakdownNode;
  funds: FundSeries[];
  total: number;
  texts: GroupTexts;
  /** Shows only the largest groups. */
  groupCount?: number;
  labelWidth?: number;
};

/** Groups (e.g. sectors) as stacked bars; a click on a group shows its largest companies. */
export function GroupBreakdown({ root, funds, total, texts, groupCount, labelWidth }: Props) {
  const [selectedId, setSelectedId] = useState<string>();
  const selected = root.children.find((group) => group.id === selectedId);
  const groups = root.children.slice(0, groupCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{selected ? texts.groupHint : texts.hint}</CardDescription>
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
              {selected.children.length.toLocaleString("de-DE")} Positionen {texts.inGroup}{" "}
              (zusammen {formatPercent(selected.value / total)} vom Depot).
            </p>
          </>
        ) : (
          <>
            <FundStackedBars
              rows={groups}
              funds={funds}
              total={total}
              labelWidth={labelWidth}
              onRowClick={(group) => setSelectedId(group.id)}
            />
            {groups.length < root.children.length && (
              <p className="text-xs text-muted-foreground">
                Zeigt {groups.length} von {root.children.length} {texts.groups} (zusammen{" "}
                {formatPercent(groups.reduce((sum, group) => sum + group.value, 0) / total)} vom
                Depot).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
