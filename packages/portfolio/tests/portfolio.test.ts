import type { FundData, FxRates } from "@analytic-republic/etf-data";
import type { Position } from "@analytic-republic/traderepublic";
import { describe, expect, test } from "vite-plus/test";
import {
  breakdownByRegion,
  CASH_NODE_ID,
  companies,
  lookThrough,
  totals,
  valuePositions,
} from "../src/index.ts";

// Made-up funds and positions.
const world: FundData = {
  isin: "IE0000000001",
  name: "Example World",
  provider: "ishares",
  holdingsAsOf: "2026-10-29",
  nav: { value: 110, currency: "USD", asOf: "2026-10-30" },
  holdings: [
    { name: "ALPHABET CLASS A", weight: 0.3, country: "US", kind: "equity" },
    { name: "ALPHABET CLASS C", weight: 0.2, country: "US", kind: "equity" },
    { name: "SHOP CORP", weight: 0.1, country: "CA", kind: "equity" },
    { name: "SAP", weight: 0.35, country: "DE", kind: "equity" },
    { name: "USD CASH", weight: 0.05, country: "US", kind: "cash" },
  ],
};

const europe: FundData = {
  isin: "IE0000000002",
  name: "Example Europe",
  provider: "ishares",
  holdingsAsOf: "2026-10-29",
  nav: { value: 50, currency: "EUR", asOf: "2026-10-30" },
  holdings: [
    { name: "SAP SE", weight: 0.6, country: "DE", kind: "equity" },
    { name: "NESTLE SA", weight: 0.4, country: "CH", kind: "equity" },
  ],
};

const fx: FxRates = { asOf: "2026-10-30", perEur: { EUR: 1, USD: 1.1 } };

const positions: Position[] = [
  { isin: world.isin, name: "World", shares: 10, costBasis: 800 },
  { isin: europe.isin, name: "Europe", shares: 4, costBasis: 250 },
  { isin: "IE0000000003", name: "Unknown", shares: 1, costBasis: 10 },
];

const funds = new Map([world, europe].map((fund) => [fund.isin, fund]));
const valued = valuePositions(positions, funds, fx);

describe("valuePositions", () => {
  test("values at the NAV converted to EUR", () => {
    expect(valued[0]?.navEur).toBeCloseTo(100);
    expect(valued[0]?.marketValue).toBeCloseTo(1000);
    expect(valued[0]?.gain).toBeCloseTo(200);
    expect(valued[1]?.marketValue).toBeCloseTo(200);
    expect(valued[1]?.gain).toBeCloseTo(-50);
  });

  test("leaves positions without fund data unvalued", () => {
    expect(valued[2]).toEqual({ ...positions[2], fund: undefined });
  });

  test("totals only include valued positions", () => {
    const sum = totals(valued);
    expect(sum.marketValue).toBeCloseTo(1200);
    expect(sum.costBasis).toBe(1050);
    expect(sum.gain).toBeCloseTo(150);
  });
});

describe("breakdownByRegion", () => {
  const tree = breakdownByRegion(lookThrough(valued));
  const node = (...ids: string[]) =>
    ids.reduce(
      (current, id) => current?.children.find((c) => c.id === id),
      tree as typeof tree | undefined,
    );

  test("splits the market value into regions, largest first", () => {
    expect(tree.value).toBeCloseTo(1200);
    expect(tree.children.map((c) => [c.id, Math.round(c.value)])).toEqual([
      ["north-america", 600],
      ["europe", 550],
      [CASH_NODE_ID, 50],
    ]);
  });

  test("nests countries and merges share classes into one company", () => {
    const us = node("north-america", "US");
    expect(us?.label).toBe("Vereinigte Staaten");
    expect(us?.children).toHaveLength(1);
    expect(us?.children[0]).toMatchObject({ label: "ALPHABET", country: "US" });
    expect(us?.children[0]?.value).toBeCloseTo(500);
  });

  test("tracks the contribution of each fund", () => {
    const germany = node("europe", "DE");
    expect(germany?.byFund[world.isin]).toBeCloseTo(350);
    expect(germany?.byFund[europe.isin]).toBeCloseTo(120);
  });
});

describe("companies", () => {
  test("merges the same company across funds, largest first", () => {
    const list = companies(lookThrough(valued));
    expect(list.map((c) => c.label)).toEqual(["ALPHABET", "SAP", "SHOP CORP", "NESTLE SA"]);
    expect(list[1]?.value).toBeCloseTo(470);
    expect(Object.keys(list[1]!.byFund)).toEqual([world.isin, europe.isin]);
  });
});
