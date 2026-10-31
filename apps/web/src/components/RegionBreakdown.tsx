import type { BreakdownNode } from "@analytic-republic/portfolio";
import { ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RANK_COUNT, RANK_OTHER_COLOR, rankColor } from "@/lib/colors";
import { formatEur, formatPercent } from "@/lib/format";
import type { FundSeries } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Donut, type Slice } from "./Donut";
import { FundLegend, FundMixBar } from "./FundMix";

/** Children below this share of the current level are folded into "Sonstige" in the donut. */
const MIN_SLICE_SHARE = 0.015;
const OTHER_ID = "__other";

const HINTS = [
  "Klicke auf eine Region, um ihre Länder zu sehen.",
  "Klicke auf ein Land, um die größten Unternehmen zu sehen.",
  "Unternehmen in diesem Land über alle ETFs.",
];

type Props = {
  root: BreakdownNode;
  funds: FundSeries[];
};

/** Donut with drill-down world → region → country → company, plus a full list. */
export function RegionBreakdown({ root, funds }: Props) {
  const [path, setPath] = useState<string[]>([]);

  // Resolve the path; ids that no longer exist (new upload) end it.
  const trail = [root];
  for (const id of path) {
    const next = trail.at(-1)!.children.find((child) => child.id === id);
    if (!next) break;
    trail.push(next);
  }
  const current = trail.at(-1)!;
  const total = root.value;

  const colored = current.children.filter(
    (child, index) => index < RANK_COUNT && child.value / current.value >= MIN_SLICE_SHARE,
  );
  const rest = current.children.slice(colored.length);
  const slices: Slice[] = colored.map((child, index) => ({
    id: child.id,
    label: child.label,
    value: child.value,
    color: rankColor(index),
  }));
  if (rest.length > 0) {
    slices.push({
      id: OTHER_ID,
      label: `Sonstige (${rest.length})`,
      value: rest.reduce((sum, child) => sum + child.value, 0),
      color: RANK_OTHER_COLOR,
    });
  }

  const open = (node: BreakdownNode) => {
    if (node.children.length > 0) setPath([...trail.slice(1).map((n) => n.id), node.id]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regionen, Länder & Unternehmen</CardTitle>
        <CardDescription>{HINTS[Math.min(trail.length - 1, HINTS.length - 1)]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((node, depth) => (
              <Fragment key={node.id}>
                {depth > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {depth === trail.length - 1 ? (
                    <BreadcrumbPage>{node.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <button type="button" onClick={() => setPath(path.slice(0, depth))}>
                        {node.label}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
          <Donut
            slices={slices}
            total={total}
            centerLabel={`${formatPercent(current.value / total)} vom Depot`}
            centerValue={formatEur(current.value)}
            onSliceClick={(slice) => {
              const node = current.children.find((child) => child.id === slice.id);
              if (node) open(node);
            }}
          />

          <div className="flex flex-col gap-3">
            <FundLegend funds={funds} />
            <ul className="max-h-[28rem] divide-y overflow-y-auto rounded-lg border">
              {current.children.map((child, index) => {
                const clickable = child.children.length > 0;
                const Row = clickable ? "button" : "div";
                return (
                  <li key={child.id}>
                    <Row
                      {...(clickable
                        ? { type: "button" as const, onClick: () => open(child) }
                        : {})}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                        clickable && "hover:bg-muted/60",
                      )}
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{
                          background: index < colored.length ? rankColor(index) : RANK_OTHER_COLOR,
                        }}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium">{child.label}</span>
                          <span className="ml-auto tabular-nums">{formatEur(child.value)}</span>
                          <span className="w-14 text-right text-muted-foreground tabular-nums">
                            {formatPercent(child.value / total)}
                          </span>
                        </div>
                        <FundMixBar byFund={child.byFund} funds={funds} />
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
            <p className="text-xs text-muted-foreground">
              Prozentangaben beziehen sich auf den gesamten Depotwert. Der Balken unter jedem
              Eintrag zeigt, aus welchen ETFs der Betrag stammt.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
