import { z } from "zod";
import { countryCodeFromGermanName } from "../countries.ts";
import type { FundData, Holding, HoldingKind } from "../model.ts";
import type { IsharesFundRef } from "../fund-ref.ts";
import type { SectorId } from "../sectors.ts";

// Unofficial JSON API behind the iShares product pages (relaunched 2026). The old
// "...ajax?fileType=csv" download only returns HTML now.
const API_URL =
  "https://www.ishares.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data";

const BASE_PARAMS = {
  appType: "PRODUCT_PAGE",
  appSubType: "ISHARES",
  targetSite: "de-ishares-v2",
  locale: "de_DE",
  userType: "individual",
  excludeContent: "true",
};

// Product search behind the search box of the iShares site. Finds a fund by its ISIN.
const SEARCH_URL = "https://www.ishares.com/varnish-api/core-search/search/products";

const SEARCH_PARAMS = {
  site: "de-ishares-v2",
  locale: "de-de",
  userType: "individual",
  start: "0",
  rows: "5",
};

export class IsharesError extends Error {
  override name = "IsharesError";
}

const dataPoint = <T extends z.ZodType>(value: T) => z.object({ value });

const fundHeaderSchema = z.object({
  fundName: z.string(),
  currencyCode: z.string().length(3),
  componentsByNameMap: z.object({
    fundHeader: z.object({
      containersByNameMap: z.object({
        fundName: z.object({
          dataPointsByNameMap: z.object({ productIsin: dataPoint(z.string()) }),
        }),
        fundNav: z.object({
          dataPointsByNameMap: z.object({
            navAmount: z.object({ value: z.number().positive(), asOfDate: z.number() }),
          }),
        }),
      }),
    }),
  }),
});

const column = <T extends z.ZodType>(item: T) => dataPoint(z.array(item.nullable()));

const holdingsSchema = z.object({
  componentsByNameMap: z.object({
    holdings: z.object({
      containersByNameMap: z.object({
        all: z.object({
          dataPointsByNameMap: z.object({
            asOfDate: dataPoint(z.number()),
            issueName: column(z.string()),
            isin: column(z.string()),
            holdingPercent: column(z.number()),
            countryOfRisk: column(z.string()),
            sectorName: column(z.string()),
            assetClass: column(z.string()),
          }),
        }),
      }),
    }),
  }),
});

const searchSchema = z.object({
  results: z.array(z.object({ portfolioId: z.string(), portfolioType: z.string() })),
});

export type IsharesFundHeaderResponse = z.input<typeof fundHeaderSchema>;
export type IsharesHoldingsResponse = z.input<typeof holdingsSchema>;

const KIND_BY_ASSET_CLASS: Record<string, HoldingKind> = {
  Aktien: "equity",
  Geldmarkt: "cash",
  "Money Market": "cash",
  "Cash Collateral and Margins": "cash",
  Futures: "derivative",
  FX: "derivative",
};

// GICS sector names as published on the German iShares site.
const SECTOR_BY_NAME: Record<string, SectorId> = {
  IT: "information-technology",
  Finanzwesen: "financials",
  Industrie: "industrials",
  Gesundheitsversorgung: "health-care",
  "Zyklische Konsumgüter": "consumer-discretionary",
  "Nichtzyklische Konsumgüter": "consumer-staples",
  Kommunikation: "communication-services",
  Energie: "energy",
  Materialien: "materials",
  Versorger: "utilities",
  Immobilien: "real-estate",
};

/** 20261029 → "2026-10-29" */
function isoDate(value: number): string {
  const digits = String(value);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function parse<T extends z.ZodType>(schema: T, data: unknown, what: string): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new IsharesError(
      `Unexpected ${what} response, the iShares API may have changed:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** Turns the raw API responses into the provider independent format. */
export function normalizeIsharesFund(
  ref: IsharesFundRef,
  fundHeaderResponse: unknown,
  holdingsResponse: unknown,
): FundData {
  const header = parse(fundHeaderSchema, fundHeaderResponse, "fundHeader");
  const containers = header.componentsByNameMap.fundHeader.containersByNameMap;
  const isin = containers.fundName.dataPointsByNameMap.productIsin.value;
  if (isin !== ref.isin) {
    throw new IsharesError(
      `Portfolio ${ref.portfolioId} is ${isin}, expected ${ref.isin}. Check cache/fund-refs.json.`,
    );
  }
  const nav = containers.fundNav.dataPointsByNameMap.navAmount;

  const columns = parse(holdingsSchema, holdingsResponse, "holdings").componentsByNameMap.holdings
    .containersByNameMap.all.dataPointsByNameMap;
  const names = columns.issueName.value;
  for (const [key, { value }] of Object.entries(columns)) {
    if (Array.isArray(value) && value.length !== names.length) {
      throw new IsharesError(
        `Holdings column ${key} has ${value.length} rows, expected ${names.length}`,
      );
    }
  }

  const holdings: Holding[] = [];
  const unknownCountries = new Set<string>();
  const unknownSectors = new Set<string>();
  names.forEach((name, i) => {
    const percent = columns.holdingPercent.value[i] ?? 0;
    if (!name || percent === 0) return;

    const countryName = columns.countryOfRisk.value[i];
    const country = countryName ? countryCodeFromGermanName(countryName) : undefined;
    if (countryName && !country) unknownCountries.add(countryName);

    const holding: Holding = {
      name: name.trim(),
      weight: percent / 100,
      kind: KIND_BY_ASSET_CLASS[columns.assetClass.value[i] ?? ""] ?? "other",
    };
    const holdingIsin = columns.isin.value[i]?.trim();
    if (holdingIsin && holdingIsin !== "-") holding.isin = holdingIsin;
    if (country) holding.country = country;
    if (holding.kind === "equity") {
      const sectorName = columns.sectorName.value[i]?.trim() ?? "";
      const sector = SECTOR_BY_NAME[sectorName];
      if (sector) holding.sector = sector;
      else unknownSectors.add(sectorName || "(leer)");
    }
    holdings.push(holding);
  });

  if (unknownCountries.size > 0) {
    throw new IsharesError(
      `Unknown country names in ${ref.isin}: ${[...unknownCountries].join(", ")}. ` +
        "Add them to GERMAN_NAME_OVERRIDES in countries.ts.",
    );
  }
  if (unknownSectors.size > 0) {
    throw new IsharesError(
      `Unknown sector names in ${ref.isin}: ${[...unknownSectors].join(", ")}. ` +
        "Add them to SECTOR_BY_NAME in providers/ishares.ts.",
    );
  }
  const totalWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.01) {
    throw new IsharesError(
      `Weights of ${ref.isin} sum up to ${(totalWeight * 100).toFixed(2)} %, expected 100 %`,
    );
  }

  return {
    isin: ref.isin,
    name: header.fundName,
    provider: "ishares",
    holdingsAsOf: isoDate(columns.asOfDate.value),
    nav: { value: nav.value, currency: header.currencyCode, asOf: isoDate(nav.asOfDate) },
    holdings,
  };
}

async function getComponent(
  ref: IsharesFundRef,
  component: string,
  fetchFn: typeof fetch,
): Promise<unknown> {
  const params = new URLSearchParams({
    ...BASE_PARAMS,
    portfolioId: String(ref.portfolioId),
    component,
  });
  const response = await fetchFn(`${API_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new IsharesError(`${component} of ${ref.isin}: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchIsharesFund(
  ref: IsharesFundRef,
  fetchFn: typeof fetch = fetch,
): Promise<FundData> {
  const header = await getComponent(ref, "fundHeader", fetchFn);
  const holdings = await getComponent(ref, "holdings.all", fetchFn);
  return normalizeIsharesFund(ref, header, holdings);
}

/**
 * Looks up the iShares portfolio id of a fund by its ISIN. Returns undefined when iShares
 * does not know the fund, e.g. because it is from another provider.
 */
export async function findIsharesFund(
  isin: string,
  fetchFn: typeof fetch = fetch,
): Promise<IsharesFundRef | undefined> {
  const params = new URLSearchParams({ ...SEARCH_PARAMS, query: isin });
  const response = await fetchFn(`${SEARCH_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new IsharesError(`Search for ${isin}: HTTP ${response.status}`);
  }
  const { results } = parse(searchSchema, await response.json(), "search");
  const ids = new Set(
    results
      .filter((result) => result.portfolioType === "ISHARES_FUND_DATA")
      .map((result) => Number(result.portfolioId)),
  );
  if (ids.size > 1) {
    throw new IsharesError(`Search for ${isin} is ambiguous: portfolios ${[...ids].join(", ")}`);
  }
  const [portfolioId] = ids;
  if (portfolioId === undefined) return undefined;
  if (!Number.isInteger(portfolioId)) {
    throw new IsharesError(`Search for ${isin} returned an invalid portfolio id`);
  }
  return { isin, provider: "ishares", portfolioId };
}
