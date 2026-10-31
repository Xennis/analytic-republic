import { z } from "zod";
import { alpha2FromAlpha3 } from "../iso3.ts";
import type { EconomyData } from "../model.ts";

// DataMapper API of the IMF World Economic Outlook. Values in billions, aggregates such as
// "WEOWORLD" or "EURO" are mixed in with the countries. Responses end with an empty
// `"": null` entry, at the level of the indicators and of the countries.
const API_URL = "https://www.imf.org/external/datamapper/api/v1/";

/** GDP in current USD and in purchasing power parity (international dollars). */
const INDICATORS = { nominal: "NGDPD", ppp: "PPPGDP" } as const;

const indicatorSchema = z.object({
  values: z.record(
    z.string(),
    z.record(z.string(), z.record(z.string(), z.number().nullable()).nullable()).nullable(),
  ),
});

export type ImfIndicatorResponse = z.input<typeof indicatorSchema>;

/**
 * Share of each country in the sum of all countries for one year, keyed by ISO 3166-1
 * alpha-2 code. Aggregates and countries without a value for the year are left out.
 */
export function parseImfShares(
  response: ImfIndicatorResponse,
  indicator: string,
  year: number,
): Record<string, number> {
  const series = indicatorSchema.parse(response).values[indicator];
  if (!series) throw new Error(`IMF: indicator ${indicator} missing`);

  const values = new Map<string, number>();
  for (const [code, byYear] of Object.entries(series)) {
    const country = alpha2FromAlpha3(code);
    const value = byYear?.[String(year)];
    if (country && value != null && value > 0) values.set(country, value);
  }
  const total = [...values.values()].reduce((sum, value) => sum + value, 0);
  if (total === 0) throw new Error(`IMF: no values for ${indicator} in ${year}`);
  return Object.fromEntries([...values].map(([country, value]) => [country, value / total]));
}

/** GDP shares of the last completed year, so that no IMF forecast is used. */
export async function fetchImfEconomy(
  fetchFn: typeof fetch = fetch,
  today: Date = new Date(),
): Promise<EconomyData> {
  const year = today.getUTCFullYear() - 1;
  const shares = async (indicator: string) => {
    const response = await fetchFn(API_URL + indicator);
    if (!response.ok) throw new Error(`IMF ${indicator}: HTTP ${response.status}`);
    return parseImfShares((await response.json()) as ImfIndicatorResponse, indicator, year);
  };
  return {
    asOf: today.toISOString().slice(0, 10),
    year,
    gdpNominal: await shares(INDICATORS.nominal),
    gdpPpp: await shares(INDICATORS.ppp),
  };
}
