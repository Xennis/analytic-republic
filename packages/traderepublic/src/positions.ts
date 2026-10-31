import type { Transaction } from "./transactions.ts";

export type Position = {
  isin: string;
  name: string;
  shares: number;
  /** EUR including fees, average cost method. */
  costBasis: number;
};

/** Below this many shares a position counts as closed (fractional rounding leftovers). */
const CLOSED_THRESHOLD = 1e-6;

/** Derives the currently held positions from chronologically sorted transactions. */
export function derivePositions(transactions: readonly Transaction[]): Position[] {
  const positions = new Map<string, Position>();

  for (const tx of transactions) {
    const position = positions.get(tx.isin) ?? {
      isin: tx.isin,
      name: tx.name,
      shares: 0,
      costBasis: 0,
    };
    position.name = tx.name;

    if (tx.type === "SELL") {
      const averageCost = position.shares > 0 ? position.costBasis / position.shares : 0;
      position.costBasis -= averageCost * Math.abs(tx.shares);
    } else {
      // A buy has a negative amount, a cancellation reverses it with a positive one.
      position.costBasis -= tx.amount + tx.fee;
    }
    position.shares += tx.shares;

    if (Math.abs(position.shares) < CLOSED_THRESHOLD) {
      position.shares = 0;
      position.costBasis = 0;
    }
    positions.set(tx.isin, position);
  }

  return [...positions.values()].filter((position) => position.shares > 0);
}
