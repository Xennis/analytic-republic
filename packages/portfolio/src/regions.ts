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

// Purely geographic. Covers all countries of the IMF World Economic Outlook, so that GDP
// shares can be summed up by region; anything else falls back to "other".
const COUNTRIES_BY_REGION: Record<Exclude<RegionId, "other">, string> = {
  "north-america": "US CA BM GL PM",
  "latin-america":
    "MX BR AR CL CO PE UY PA KY AG AI AW BB BO BQ BS BZ CR CU CW DM DO EC FK GD GF GP GT GY HN " +
    "HT JM KN LC MQ MS NI PR PY SR SV SX TC TT VC VE VG VI",
  europe:
    "EU AT BE BG CH CY CZ DE DK EE ES FI FO FR GB GG GR HR HU IE IM IS IT JE LI LT LU LV MC MT NL " +
    "NO PL PT RO RS RU SE SI SK TR UA AD AL BA BY GI MD ME MK SJ SM VA XK",
  "middle-east": "AE BH IL JO KW OM QA SA IQ IR LB PS SY YE",
  africa:
    "EG KE MA MU NG ZA AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EH ER ET GA GH GM GN GQ GW KM LR " +
    "LS LY MG ML MR MW MZ NA NE RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZM ZW",
  asia:
    "BD CN HK ID IN JP KR KZ LK MO MY PH PK SG TH TW VN AF AM AZ BN BT GE IO KG KH KP LA MM MN " +
    "MV NP TJ TL TM UZ",
  oceania: "AU NZ PG AS CK FJ FM GU KI MH MP NC NR NU PF PN PW SB TK TO TV VU WF WS",
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
