import { isSectorId, type FundData, type FxRates } from "@analytic-republic/etf-data";

// Written by `pnpm fetch-data`. Globs instead of imports so the app still starts
// (with a hint) when the cache has not been created yet.
const fundFiles = import.meta.glob<FundData>("../../../../packages/etf-data/cache/funds/*.json", {
  eager: true,
  import: "default",
});
const fxFiles = import.meta.glob<FxRates>("../../../../packages/etf-data/cache/fx.json", {
  eager: true,
  import: "default",
});

export const cachedFunds: ReadonlyMap<string, FundData> = new Map(
  Object.values(fundFiles).map((fund) => [fund.isin, fund]),
);

export const cachedFx: FxRates | undefined = Object.values(fxFiles)[0];

/** True when the cache was written by an older version of `pnpm fetch-data`. */
export const cacheOutdated = [...cachedFunds.values()].some((fund) =>
  fund.holdings.some((holding) => holding.kind === "equity" && !isSectorId(holding.sector)),
);
