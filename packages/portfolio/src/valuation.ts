import type { FundData, FxRates } from "@analytic-republic/etf-data";
import type { Position } from "@analytic-republic/traderepublic";

export type ValuedPosition = Position & {
  /** Undefined when there is no cached data for this fund. */
  fund?: FundData;
  /** NAV per share in EUR. */
  navEur?: number;
  marketValue?: number;
  gain?: number;
};

export type Totals = {
  marketValue: number;
  costBasis: number;
  gain: number;
};

/** Values positions at the fund NAV, converted to EUR with the ECB reference rates. */
export function valuePositions(
  positions: readonly Position[],
  funds: ReadonlyMap<string, FundData>,
  fx: FxRates | undefined,
): ValuedPosition[] {
  return positions.map((position) => {
    const fund = funds.get(position.isin);
    const rate = fund && fx?.perEur[fund.nav.currency];
    if (!fund || !rate) return { ...position, fund };

    const navEur = fund.nav.value / rate;
    const marketValue = position.shares * navEur;
    return { ...position, fund, navEur, marketValue, gain: marketValue - position.costBasis };
  });
}

/** Sums up all positions that could be valued. */
export function totals(positions: readonly ValuedPosition[]): Totals {
  const valued = positions.filter((position) => position.marketValue !== undefined);
  const marketValue = valued.reduce((sum, position) => sum + position.marketValue!, 0);
  const costBasis = valued.reduce((sum, position) => sum + position.costBasis, 0);
  return { marketValue, costBasis, gain: marketValue - costBasis };
}
