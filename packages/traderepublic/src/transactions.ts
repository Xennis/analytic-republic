import Papa from "papaparse";
import { z } from "zod";

export type TransactionType = "BUY" | "SELL" | "BUY_CANCELLED";

export type Transaction = {
  datetime: Date;
  type: TransactionType;
  isin: string;
  name: string;
  /** Signed: positive for buys, negative for sells and cancellations. */
  shares: number;
  /** EUR, signed: negative when money leaves the cash account. */
  amount: number;
  /** EUR, signed (fees are negative). */
  fee: number;
};

export class TradeRepublicParseError extends Error {
  override name = "TradeRepublicParseError";
}

// Only the columns we need. Personal columns (counterparty, IBAN, ...) are never read.
const REQUIRED_COLUMNS = [
  "datetime",
  "category",
  "type",
  "asset_class",
  "name",
  "symbol",
  "shares",
  "amount",
  "fee",
] as const;

const RELEVANT_TYPES = new Set<string>(["BUY", "SELL", "BUY_CANCELLED"]);

const decimal = (field: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return 0;
      const number = Number(value);
      if (!Number.isFinite(number)) {
        ctx.addIssue({ code: "custom", message: `${field} is not a number: "${value}"` });
        return z.NEVER;
      }
      return number;
    });

const tradingRowSchema = z.object({
  datetime: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  type: z.enum(["BUY", "SELL", "BUY_CANCELLED"]),
  symbol: z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}\d$/, "symbol is not an ISIN"),
  name: z.string().trim().min(1),
  shares: decimal("shares"),
  amount: decimal("amount"),
  fee: decimal("fee"),
});

/**
 * Parses a Trade Republic CSV export ("Transaktionsexport") and returns the fund trades,
 * sorted chronologically. Cash movements and all other row types are ignored.
 */
export function parseTransactions(csvText: string): Transaction[] {
  const result = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
  });

  const columns = result.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    throw new TradeRepublicParseError(
      `Die Datei sieht nicht wie ein Trade-Republic-Export aus. Es fehlen die Spalten: ${missing.join(", ")}`,
    );
  }

  const transactions: Transaction[] = [];
  result.data.forEach((row, index) => {
    if (row.category !== "TRADING" || row.asset_class !== "FUND") return;
    if (!RELEVANT_TYPES.has(row.type ?? "")) return;

    const parsed = tradingRowSchema.safeParse(row);
    if (!parsed.success) {
      // +2: one for the header line, one because lines are 1-based.
      throw new TradeRepublicParseError(
        `Zeile ${index + 2} konnte nicht gelesen werden: ${z.prettifyError(parsed.error)}`,
      );
    }
    const { symbol, ...rest } = parsed.data;
    transactions.push({ ...rest, isin: symbol });
  });

  return transactions.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
}
