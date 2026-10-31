export type HoldingKind = "equity" | "cash" | "derivative" | "other";

export type Holding = {
  /** Name as published by the provider, e.g. "ALPHABET CLASS A". */
  name: string;
  isin?: string;
  /** Share of the fund, 0..1. */
  weight: number;
  /** ISO 3166-1 alpha-2 country of risk, "EU" for euro positions without a country. */
  country?: string;
  sector?: string;
  kind: HoldingKind;
};

export type FundData = {
  isin: string;
  name: string;
  provider: string;
  /** ISO date of the holdings snapshot. */
  holdingsAsOf: string;
  nav: { value: number; currency: string; asOf: string };
  holdings: Holding[];
};

export type FxRates = {
  /** ISO date of the reference rates. */
  asOf: string;
  /** Units of the currency for 1 EUR, e.g. { USD: 1.12 }. */
  perEur: Record<string, number>;
};
