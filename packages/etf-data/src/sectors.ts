/** The 11 GICS sectors, independent of how a provider names them. */
export const SECTOR_IDS = [
  "information-technology",
  "financials",
  "industrials",
  "health-care",
  "consumer-discretionary",
  "consumer-staples",
  "communication-services",
  "energy",
  "materials",
  "utilities",
  "real-estate",
] as const;

export type SectorId = (typeof SECTOR_IDS)[number];

export function isSectorId(value: unknown): value is SectorId {
  return SECTOR_IDS.includes(value as SectorId);
}
