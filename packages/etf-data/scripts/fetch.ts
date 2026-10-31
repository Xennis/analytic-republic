// Downloads holdings and NAVs of the funds in a Trade Republic export plus ECB exchange
// rates into ../cache. Without an export it refreshes the funds fetched before.
// Usage: pnpm fetch-data [path/to/export.csv]
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { derivePositions, parseTransactions } from "@analytic-republic/traderepublic";
import { z } from "zod";
import { fetchEcbRates, fetchIsharesFund, findIsharesFund, type FundRef } from "../src/index.ts";

const cacheDir = new URL("../cache/", import.meta.url);
const fundsDir = new URL("funds/", cacheDir);
// ISIN → provider and id, so the search only runs once per fund.
const refsFile = new URL("fund-refs.json", cacheDir);

const refsSchema = z.record(
  z.string(),
  z.object({ isin: z.string(), provider: z.literal("ishares"), portfolioId: z.number().int() }),
);

async function writeJson(url: URL, data: unknown): Promise<void> {
  await writeFile(url, JSON.stringify(data, null, 2) + "\n");
}

async function readRefs(): Promise<Record<string, FundRef>> {
  try {
    return refsSchema.parse(JSON.parse(await readFile(refsFile, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

const refs = await readRefs();
const names = new Map<string, string>();

const csvArg = process.argv[2];
if (csvArg) {
  // pnpm runs the script in the package directory, INIT_CWD is where it was called.
  const csvPath = resolve(process.env.INIT_CWD ?? process.cwd(), csvArg);
  for (const position of derivePositions(parseTransactions(await readFile(csvPath, "utf8")))) {
    names.set(position.isin, position.name);
  }
  console.log(`${names.size} Positionen im Export gefunden`);
} else {
  for (const isin of Object.keys(refs)) names.set(isin, isin);
  if (names.size === 0) {
    console.error("Noch keine Fonds bekannt. Aufruf: pnpm fetch-data <Trade-Republic-Export.csv>");
    process.exit(1);
  }
}

await mkdir(fundsDir, { recursive: true });

let failed = 0;
// Sequential on purpose: a handful of requests, no need to hammer the API.
for (const [isin, name] of names) {
  try {
    const ref = refs[isin] ?? (await findIsharesFund(isin));
    if (!ref) {
      failed++;
      console.error(`✗ ${isin} ${name}: kein iShares-Fonds gefunden`);
      continue;
    }
    refs[isin] = ref;
    const fund = await fetchIsharesFund(ref);
    await writeJson(new URL(`${isin}.json`, fundsDir), fund);
    console.log(
      `✓ ${isin} ${fund.name}: ${fund.holdings.length} Positionen vom ${fund.holdingsAsOf}, ` +
        `NAV ${fund.nav.value} ${fund.nav.currency}`,
    );
  } catch (error) {
    failed++;
    console.error(`✗ ${isin} ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
await writeJson(refsFile, refs);

try {
  const fx = await fetchEcbRates();
  await writeJson(new URL("fx.json", cacheDir), fx);
  console.log(`✓ EZB-Referenzkurse vom ${fx.asOf}`);
} catch (error) {
  failed++;
  console.error(`✗ EZB-Kurse: ${error instanceof Error ? error.message : String(error)}`);
}

if (failed > 0) process.exitCode = 1;
