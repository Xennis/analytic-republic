const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const signedEur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});
const percent = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const signedPercent = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const shares = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 4 });
const date = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export const formatEur = (value: number) => eur.format(value);
export const formatSignedEur = (value: number) => signedEur.format(value);
/** 0.123 → "12,3 %" */
export const formatPercent = (share: number) => percent.format(share);
export const formatSignedPercent = (share: number) => signedPercent.format(share);
export const formatShares = (value: number) => shares.format(value);
/** "2026-10-29" → "29.10.2026" */
export const formatDate = (iso: string) => date.format(new Date(`${iso}T00:00:00`));

/** "iShares Example World UCITS ETF" → "Example World" */
export function shortFundName(name: string): string {
  return name.replace(/^iShares\s+/i, "").replace(/\s+UCITS ETF.*$/i, "");
}
