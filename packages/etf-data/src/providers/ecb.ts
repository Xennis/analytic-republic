import type { FxRates } from "../model.ts";

const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/** Parses the ECB euro reference rates XML (eurofxref-daily.xml). */
export function parseEcbRates(xml: string): FxRates {
  const asOf = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  if (!asOf) throw new Error("ECB rates: no date found");

  const perEur: Record<string, number> = { EUR: 1 };
  for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    perEur[match[1]!] = Number(match[2]);
  }
  if (Object.keys(perEur).length === 1) throw new Error("ECB rates: no rates found");
  return { asOf, perEur };
}

export async function fetchEcbRates(fetchFn: typeof fetch = fetch): Promise<FxRates> {
  const response = await fetchFn(ECB_DAILY_URL);
  if (!response.ok) throw new Error(`ECB rates: HTTP ${response.status}`);
  return parseEcbRates(await response.text());
}
