import type { FundData, FxRates } from "@analytic-republic/etf-data";
import {
  breakdownByRegion,
  breakdownBySector,
  companies,
  lookThrough,
  totals,
  valuePositions,
  type BreakdownNode,
  type Totals,
  type ValuedPosition,
} from "@analytic-republic/portfolio";
import type { Position } from "@analytic-republic/traderepublic";
import { seriesColor } from "./colors.ts";
import { shortFundName } from "./format.ts";

export type FundSeries = { isin: string; label: string; color: string };

export type Analysis = {
  positions: ValuedPosition[];
  totals: Totals;
  /** Funds with data, largest first. Fixes label and color of each fund for all charts. */
  funds: FundSeries[];
  regions: BreakdownNode;
  sectors: BreakdownNode;
  companies: BreakdownNode[];
  /** Positions that could not be valued because the cache has no data for them. */
  missing: ValuedPosition[];
};

export function analyze(
  positions: readonly Position[],
  fundData: ReadonlyMap<string, FundData>,
  fx: FxRates | undefined,
): Analysis {
  const valued = valuePositions(positions, fundData, fx).sort(
    (a, b) => (b.marketValue ?? -1) - (a.marketValue ?? -1),
  );
  const withData = valued.filter((position) => position.marketValue !== undefined);
  const exposures = lookThrough(withData);

  return {
    positions: valued,
    totals: totals(valued),
    funds: withData.map((position, index) => ({
      isin: position.isin,
      label: shortFundName(position.fund?.name ?? position.name),
      color: seriesColor(index),
    })),
    regions: breakdownByRegion(exposures),
    sectors: breakdownBySector(exposures),
    companies: companies(exposures),
    missing: valued.filter((position) => position.marketValue === undefined),
  };
}
