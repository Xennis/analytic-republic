import { describe, expect, test } from "vite-plus/test";
import {
  fetchIsharesFund,
  IsharesError,
  normalizeIsharesFund,
  type IsharesFundRef,
} from "../src/index.ts";

const ref: IsharesFundRef = { isin: "IE0000000001", provider: "ishares", portfolioId: 1 };

// Trimmed, made-up responses in the shape of the iShares product-data API.
function fundHeader(isin = ref.isin) {
  return {
    fundName: "iShares Example World UCITS ETF",
    currencyCode: "USD",
    componentsByNameMap: {
      fundHeader: {
        containersByNameMap: {
          fundName: { dataPointsByNameMap: { productIsin: { value: isin } } },
          fundNav: {
            dataPointsByNameMap: { navAmount: { value: 100.5, asOfDate: 20261030 } },
          },
        },
      },
    },
  };
}

function holdings(rows: [string, string | null, number, string | null, string | null, string][]) {
  const columnOf = (index: number) => ({ value: rows.map((row) => row[index]) });
  return {
    componentsByNameMap: {
      holdings: {
        containersByNameMap: {
          all: {
            dataPointsByNameMap: {
              asOfDate: { value: 20261029 },
              issueName: columnOf(0),
              isin: columnOf(1),
              holdingPercent: columnOf(2),
              countryOfRisk: columnOf(3),
              sectorName: columnOf(4),
              assetClass: columnOf(5),
            },
          },
        },
      },
    },
  };
}

const exampleHoldings = holdings([
  ["EXAMPLE TECH", "US0000000001", 60, "Vereinigte Staaten", "IT", "Aktien"],
  ["EXAMPLE BANK", "KR0000000001", 30, "Korea", "Finanzwesen ", "Aktien"],
  ["EUR CASH", null, 9.5, "Europäische Union", "Cash und/oder Derivate", "Geldmarkt"],
  ["S&P500 EMINI DEC 26", null, 0.5, null, null, "Futures"],
  ["ZERO FUTURE", null, 0, null, null, "Futures"],
]);

describe("normalizeIsharesFund", () => {
  test("normalizes holdings, countries and NAV", () => {
    const fund = normalizeIsharesFund(ref, fundHeader(), exampleHoldings);

    expect(fund).toEqual({
      isin: ref.isin,
      name: "iShares Example World UCITS ETF",
      provider: "ishares",
      holdingsAsOf: "2026-10-29",
      nav: { value: 100.5, currency: "USD", asOf: "2026-10-30" },
      holdings: [
        {
          name: "EXAMPLE TECH",
          isin: "US0000000001",
          weight: 0.6,
          country: "US",
          sector: "IT",
          kind: "equity",
        },
        {
          name: "EXAMPLE BANK",
          isin: "KR0000000001",
          weight: 0.3,
          country: "KR",
          sector: "Finanzwesen",
          kind: "equity",
        },
        {
          name: "EUR CASH",
          weight: 0.095,
          country: "EU",
          sector: "Cash und/oder Derivate",
          kind: "cash",
        },
        { name: "S&P500 EMINI DEC 26", weight: 0.005, kind: "derivative" },
      ],
    });
  });

  test("rejects a portfolio id that belongs to another fund", () => {
    expect(() => normalizeIsharesFund(ref, fundHeader("IE0000000009"), exampleHoldings)).toThrow(
      /expected IE0000000001/,
    );
  });

  test("rejects unknown country names", () => {
    const data = holdings([["X", null, 100, "Atlantis", null, "Aktien"]]);
    expect(() => normalizeIsharesFund(ref, fundHeader(), data)).toThrow(/Atlantis/);
  });

  test("rejects incomplete holdings", () => {
    const data = holdings([["X", null, 50, "Japan", null, "Aktien"]]);
    expect(() => normalizeIsharesFund(ref, fundHeader(), data)).toThrow(/50.00 %/);
  });

  test("reports a changed API shape", () => {
    expect(() => normalizeIsharesFund(ref, {}, exampleHoldings)).toThrow(IsharesError);
  });
});

describe("fetchIsharesFund", () => {
  test("requests both components of the portfolio", async () => {
    const urls: URL[] = [];
    const fakeFetch = (async (input: string | URL) => {
      const url = new URL(String(input));
      urls.push(url);
      const body =
        url.searchParams.get("component") === "fundHeader" ? fundHeader() : exampleHoldings;
      return new Response(JSON.stringify(body));
    }) as typeof fetch;

    const fund = await fetchIsharesFund(ref, fakeFetch);

    expect(fund.holdings).toHaveLength(4);
    expect(urls.map((url) => url.searchParams.get("component"))).toEqual([
      "fundHeader",
      "holdings.all",
    ]);
    expect(urls.every((url) => url.searchParams.get("portfolioId") === "1")).toBe(true);
  });

  test("fails on HTTP errors", async () => {
    const fakeFetch = (async () => new Response("", { status: 503 })) as typeof fetch;
    await expect(fetchIsharesFund(ref, fakeFetch)).rejects.toThrow(/HTTP 503/);
  });
});
