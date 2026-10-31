/** Names used by providers that differ from what Intl.DisplayNames returns. */
const GERMAN_NAME_OVERRIDES: Record<string, string> = {
  Hongkong: "HK",
  Korea: "KR",
  Qatar: "QA",
  "Ver. Arabische Emirate": "AE",
};

let germanNames: Map<string, string> | undefined;

function germanNameIndex(): Map<string, string> {
  if (germanNames) return germanNames;
  const displayNames = new Intl.DisplayNames(["de"], { type: "region", fallback: "none" });
  germanNames = new Map();
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      // Skip deprecated aliases like UK (→ GB) that share the name of the canonical code.
      if (Intl.getCanonicalLocales(`und-${code}`)[0] !== `und-${code}`) continue;
      const name = displayNames.of(code);
      if (name) germanNames.set(name, code);
    }
  }
  for (const [name, code] of Object.entries(GERMAN_NAME_OVERRIDES)) germanNames.set(name, code);
  return germanNames;
}

/** Maps a German country name ("Vereinigte Staaten") to its ISO code ("US"). */
export function countryCodeFromGermanName(name: string): string | undefined {
  return germanNameIndex().get(name.trim());
}

let englishNames: [string, string][] | undefined;

/** Upper-case English country names, longest first so "SOUTH AFRICA" wins over "AFRICA". */
function englishNameIndex(): [string, string][] {
  if (englishNames) return englishNames;
  const displayNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  englishNames = [];
  for (const code of germanNameIndex().values()) {
    const name = displayNames.of(code);
    if (name && code !== "EU") englishNames.push([name.toUpperCase(), code]);
  }
  englishNames.push(["KOREA", "KR"]);
  englishNames.sort(([a], [b]) => b.length - a.length);
  return englishNames;
}

/** Finds a country in an English text, e.g. "ISHARES MSCI BRAZIL UCITS ET" → "BR". */
export function countryCodeInEnglishText(text: string): string | undefined {
  const upper = ` ${text.toUpperCase().replace(/[^A-Z]+/g, " ")} `;
  return englishNameIndex().find(([name]) => upper.includes(` ${name} `))?.[1];
}
