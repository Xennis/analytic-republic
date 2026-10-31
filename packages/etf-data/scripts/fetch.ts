// Downloads holdings and NAVs of all registered funds plus ECB exchange rates into ../cache.
// Usage: pnpm fetch-data
import { mkdir, writeFile } from "node:fs/promises";
import { fetchEcbRates, fetchIsharesFund, funds } from "../src/index.ts";

const cacheDir = new URL("../cache/", import.meta.url);
const fundsDir = new URL("funds/", cacheDir);

async function writeJson(url: URL, data: unknown): Promise<void> {
  await writeFile(url, JSON.stringify(data) + "\n");
}

await mkdir(fundsDir, { recursive: true });

let failed = 0;
// Sequential on purpose: a handful of requests, no need to hammer the API.
for (const ref of funds) {
  try {
    const fund = await fetchIsharesFund(ref);
    await writeJson(new URL(`${ref.isin}.json`, fundsDir), fund);
    console.log(
      `✓ ${ref.isin} ${fund.name}: ${fund.holdings.length} Positionen vom ${fund.holdingsAsOf}, ` +
        `NAV ${fund.nav.value} ${fund.nav.currency}`,
    );
  } catch (error) {
    failed++;
    console.error(`✗ ${ref.isin}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  const fx = await fetchEcbRates();
  await writeJson(new URL("fx.json", cacheDir), fx);
  console.log(`✓ EZB-Referenzkurse vom ${fx.asOf}`);
} catch (error) {
  failed++;
  console.error(`✗ EZB-Kurse: ${error instanceof Error ? error.message : String(error)}`);
}

if (failed > 0) process.exitCode = 1;
