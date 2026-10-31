import { expect, test } from "vite-plus/test";
import { fetchImfEconomy, parseImfShares, type ImfIndicatorResponse } from "../src/index.ts";

// Shortened DataMapper responses with made-up values.
const nominal: ImfIndicatorResponse = {
  values: {
    NGDPD: {
      USA: { "2024": 28, "2025": 30, "2026": 32 },
      DEU: { "2024": 4.5, "2025": 5, "2026": 5.2 },
      TWN: { "2025": 1 },
      // Aggregate, not a country.
      WEOWORLD: { "2025": 100 },
      // No value for the year.
      SYR: { "2024": 0.1 },
      // Kosovo has an IMF code without ISO counterpart.
      UVK: { "2025": 0.1 },
      "": null,
    },
    "": null,
  },
};

const ppp: ImfIndicatorResponse = {
  values: { PPPGDP: { USA: { "2025": 30 }, IND: { "2025": 20 } } },
};

test("returns the share of each country in the sum of all countries", () => {
  const shares = parseImfShares(nominal, "NGDPD", 2025);
  expect(Object.keys(shares).sort()).toEqual(["DE", "TW", "US", "XK"]);
  expect(shares.US).toBeCloseTo(30 / 36.1);
  expect(shares.XK).toBeCloseTo(0.1 / 36.1);
  expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBeCloseTo(1);
});

test("fails without values for the year", () => {
  expect(() => parseImfShares(nominal, "NGDPD", 2030)).toThrow(/no values/);
  expect(() => parseImfShares(nominal, "PPPGDP", 2025)).toThrow(/missing/);
});

test("uses the last completed year", async () => {
  const fetchFn = (async (url: string) =>
    Response.json(url.endsWith("NGDPD") ? nominal : ppp)) as typeof fetch;
  const economy = await fetchImfEconomy(fetchFn, new Date("2026-10-31T12:00:00Z"));
  expect(economy.asOf).toBe("2026-10-31");
  expect(economy.year).toBe(2025);
  expect(economy.gdpNominal.US).toBeCloseTo(30 / 36.1);
  expect(economy.gdpPpp).toEqual({ US: 0.6, IN: 0.4 });
});
