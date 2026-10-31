import type { SectorId } from "@analytic-republic/etf-data";

export type SectorLabel = { short: string; full: string };

export const SECTORS: Record<SectorId, SectorLabel> = {
  "information-technology": { short: "IT", full: "Informationstechnologie" },
  financials: { short: "Finanzen", full: "Finanzwesen" },
  industrials: { short: "Industrie", full: "Industrie" },
  "health-care": { short: "Gesundheit", full: "Gesundheitswesen" },
  "consumer-discretionary": { short: "Zykl. Konsum", full: "Zyklische Konsumgüter" },
  "consumer-staples": { short: "Basiskonsum", full: "Nichtzyklische Konsumgüter" },
  "communication-services": { short: "Kommunikation", full: "Kommunikationsdienste" },
  energy: { short: "Energie", full: "Energie" },
  materials: { short: "Grundstoffe", full: "Grundstoffe und Materialien" },
  utilities: { short: "Versorger", full: "Versorgungsbetriebe" },
  "real-estate": { short: "Immobilien", full: "Immobilien" },
};

const UNKNOWN_SECTOR: SectorLabel = { short: "Unbekannt", full: "Sektor unbekannt" };

export function sectorLabel(sector: SectorId | undefined): SectorLabel {
  return sector ? SECTORS[sector] : UNKNOWN_SECTOR;
}
