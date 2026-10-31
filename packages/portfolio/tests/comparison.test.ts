import type { FundData } from "@analytic-republic/etf-data";
import { describe, expect, test } from "vite-plus/test";
import {
  breakdownByRegion,
  breakdownBySector,
  compareShares,
  countriesOf,
  countryShares,
  coverage,
  fundExposures,
  regionShares,
  sectorShares,
} from "../src/index.ts";

// Made-up benchmark fund.
const benchmark: FundData = {
  isin: "IE0000000009",
  name: "Example All World",
  provider: "ishares",
  holdingsAsOf: "2026-10-29",
  nav: { value: 10, currency: "USD", asOf: "2026-10-30" },
  holdings: [
    { name: "APPLE", weight: 0.5, country: "US", sector: "information-technology", kind: "equity" },
    { name: "NESTLE", weight: 0.2, country: "CH", sector: "consumer-staples", kind: "equity" },
    { name: "SAP", weight: 0.18, country: "DE", sector: "information-technology", kind: "equity" },
    { name: "ISHARES MSCI INDIA", weight: 0.1, country: "IN", isFund: true, kind: "equity" },
    { name: "USD CASH", weight: 0.02, country: "US", kind: "cash" },
  ],
};

const exposures = fundExposures(benchmark);

describe("fundExposures", () => {
  test("values each holding at its weight", () => {
    expect(exposures.map((exposure) => exposure.value)).toEqual([0.5, 0.2, 0.18, 0.1, 0.02]);
    expect(exposures[0]?.fundIsin).toBe(benchmark.isin);
  });
});

describe("countryShares", () => {
  test("returns the share of each country in the equities", () => {
    const shares = countryShares(countriesOf(breakdownByRegion(exposures)));
    expect(shares).toEqual({
      US: expect.closeTo(0.5 / 0.98),
      CH: expect.closeTo(0.2 / 0.98),
      DE: expect.closeTo(0.18 / 0.98),
      IN: expect.closeTo(0.1 / 0.98),
    });
  });
});

describe("sectorShares", () => {
  test("leaves out cash and holdings without a sector", () => {
    expect(sectorShares(breakdownBySector(exposures))).toEqual({
      "information-technology": expect.closeTo(0.68 / 0.88),
      "consumer-staples": expect.closeTo(0.2 / 0.88),
    });
  });
});

describe("regionShares", () => {
  test("sums up countries by region", () => {
    expect(regionShares({ US: 0.5, DE: 0.2, CH: 0.1, DZ: 0.15, IR: 0.05 })).toEqual({
      "north-america": 0.5,
      europe: expect.closeTo(0.3),
      africa: 0.15,
      "middle-east": 0.05,
    });
  });
});

describe("compareShares", () => {
  test("lists keys of the portfolio and all benchmarks, largest share first", () => {
    const rows = compareShares({ US: 0.7, DE: 0.3 }, [{ US: 0.3, CN: 0.5, DE: 0.2 }, { US: 0.6 }]);
    expect(rows).toEqual([
      { id: "US", portfolio: 0.7, benchmarks: [0.3, 0.6] },
      { id: "CN", portfolio: 0, benchmarks: [0.5, 0] },
      { id: "DE", portfolio: 0.3, benchmarks: [0.2, 0] },
    ]);
  });
});

describe("coverage", () => {
  test("is 1 for equal and 0 for disjoint distributions", () => {
    expect(coverage({ US: 0.6, DE: 0.4 }, { DE: 0.4, US: 0.6 })).toBeCloseTo(1);
    expect(coverage({ US: 1 }, { CN: 1 })).toBe(0);
  });

  test("sums up the overlap per key", () => {
    expect(coverage({ US: 0.7, DE: 0.3 }, { US: 0.3, CN: 0.5, DE: 0.2 })).toBeCloseTo(0.5);
  });
});
