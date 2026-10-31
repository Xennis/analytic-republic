import type { FundData } from "@analytic-republic/etf-data";
import { CASH_NODE_ID, UNKNOWN_SECTOR_ID, type BreakdownNode, type Exposure } from "./breakdown.ts";
import { regionOf } from "./regions.ts";

/** Share per key (country, region or sector), summing up to 1. */
export type Shares = Record<string, number>;

export type ShareComparison = {
  id: string;
  portfolio: number;
  /** Share in each benchmark, in the order they were passed. */
  benchmarks: number[];
};

/** The holdings of a fund as exposures worth their weight, e.g. to break down a benchmark. */
export function fundExposures(fund: FundData): Exposure[] {
  return fund.holdings.map((holding) => ({
    fundIsin: fund.isin,
    holding,
    value: holding.weight,
  }));
}

function normalize(entries: [string, number][]): Shares {
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  return total > 0 ? Object.fromEntries(entries.map(([id, value]) => [id, value / total])) : {};
}

/** Countries of a `countriesOf` tree as shares of the equities. */
export function countryShares(countries: BreakdownNode): Shares {
  return normalize(countries.children.map((country) => [country.id, country.value]));
}

/**
 * Sectors of a `breakdownBySector` tree as shares of the equities. Cash and holdings without a
 * sector (funds inside the fund) are left out.
 */
export function sectorShares(sectors: BreakdownNode): Shares {
  return normalize(
    sectors.children
      .filter((sector) => sector.id !== CASH_NODE_ID && sector.id !== UNKNOWN_SECTOR_ID)
      .map((sector) => [sector.id, sector.value]),
  );
}

/** Country shares summed up by region. */
export function regionShares(countries: Shares): Shares {
  const regions: Shares = {};
  for (const [country, share] of Object.entries(countries)) {
    const region = regionOf(country);
    regions[region] = (regions[region] ?? 0) + share;
  }
  return regions;
}

/**
 * One row per key in the portfolio or any benchmark, largest first by the largest of its
 * shares, so that keys with a big benchmark share but no money in them come up too.
 */
export function compareShares(portfolio: Shares, benchmarks: readonly Shares[]): ShareComparison[] {
  const ids = new Set([portfolio, ...benchmarks].flatMap((shares) => Object.keys(shares)));
  return [...ids]
    .map((id) => ({
      id,
      portfolio: portfolio[id] ?? 0,
      benchmarks: benchmarks.map((shares) => shares[id] ?? 0),
    }))
    .sort(
      (a, b) => Math.max(b.portfolio, ...b.benchmarks) - Math.max(a.portfolio, ...a.benchmarks),
    );
}

/**
 * Overlap of two distributions: 1 when they are equal, 0 when they share nothing. Equals one
 * minus half the sum of the absolute differences.
 */
export function coverage(a: Shares, b: Shares): number {
  return Object.entries(a).reduce((sum, [id, share]) => sum + Math.min(share, b[id] ?? 0), 0);
}
