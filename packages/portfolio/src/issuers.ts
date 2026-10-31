// Providers list each share class separately ("ALPHABET CLASS A", "ALPHABET CLASS C").
// These helpers merge them into one company.

const SHARE_CLASS_SUFFIX =
  /\s+(?:CLASS\s+[A-Z]+|SERIES\s+[A-Z]+|CL\s+[A-Z]|PREF(?:ERRED)?(?:\s+[A-Z])?|NON[\s-]?VOTING.*|[A-Z])$/;
const LEGAL_SUFFIX =
  /\s+(?:INC|CORP|CORPORATION|CO|LTD|LIMITED|PLC|AG|SA|SE|NV|AB|ASA|OYJ|SPA|HOLDINGS?|GROUP)\.?$/;

/** Name without share class, e.g. "ALPHABET CLASS A" → "ALPHABET". */
export function companyName(name: string): string {
  let result = name.trim().replace(/\s+/g, " ");
  for (let previous = ""; previous !== result;) {
    previous = result;
    result = result.replace(SHARE_CLASS_SUFFIX, "");
  }
  return result || name.trim();
}

/** Key that is equal for all share classes of a company. */
export function issuerKey(name: string, country: string | undefined): string {
  let key = companyName(name.toUpperCase()).replace(/[.,]/g, "");
  for (let previous = ""; previous !== key;) {
    previous = key;
    key = key.replace(LEGAL_SUFFIX, "");
  }
  return `${country ?? "??"}:${key}`;
}
