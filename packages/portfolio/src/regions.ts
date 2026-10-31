export type RegionId =
  | "north-america"
  | "latin-america"
  | "europe"
  | "middle-east"
  | "africa"
  | "asia"
  | "oceania"
  | "other";

export const REGION_LABELS: Record<RegionId, string> = {
  "north-america": "Nordamerika",
  "latin-america": "Lateinamerika",
  europe: "Europa",
  "middle-east": "Naher Osten",
  africa: "Afrika",
  asia: "Asien",
  oceania: "Ozeanien",
  other: "Sonstige",
};

// Purely geographic. Covers the countries of common world/EM indices; anything else
// falls back to "other".
const COUNTRIES_BY_REGION: Record<Exclude<RegionId, "other">, string> = {
  "north-america": "US CA BM",
  "latin-america": "MX BR AR CL CO PE UY PA KY",
  europe:
    "EU AT BE BG CH CY CZ DE DK EE ES FI FO FR GB GG GR HR HU IE IM IS IT JE LI LT LU LV MC MT NL NO PL PT RO RS RU SE SI SK TR UA",
  "middle-east": "AE BH IL JO KW OM QA SA",
  africa: "EG KE MA MU NG ZA",
  asia: "BD CN HK ID IN JP KR KZ LK MO MY PH PK SG TH TW VN",
  oceania: "AU NZ PG",
};

const REGION_BY_COUNTRY = new Map<string, RegionId>(
  Object.entries(COUNTRIES_BY_REGION).flatMap(([region, countries]) =>
    countries.split(" ").map((country) => [country, region as RegionId] as const),
  ),
);

export function regionOf(country: string | undefined): RegionId {
  return (country && REGION_BY_COUNTRY.get(country)) || "other";
}

const countryNames = new Intl.DisplayNames(["de"], { type: "region" });

export function countryLabel(country: string | undefined): string {
  return country ? (countryNames.of(country) ?? country) : "Unbekannt";
}
