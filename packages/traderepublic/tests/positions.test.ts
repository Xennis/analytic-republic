import { describe, expect, test } from "vite-plus/test";
import { derivePositions, parseTransactions } from "../src/index.ts";
import { buy, csv, EUROPE, row, sell, WORLD } from "./fixtures.ts";

const positionsOf = (...rows: string[]) => derivePositions(parseTransactions(csv(...rows)));

describe("derivePositions", () => {
  test("sums shares and cost including fees per fund", () => {
    const positions = positionsOf(
      buy(WORLD, "2024-01-03T10:00:00.000Z", 10, 50),
      buy(WORLD, "2024-02-03T10:00:00.000Z", 5, 60),
      buy(EUROPE, "2024-02-03T10:00:00.000Z", 2.5, 20, 0),
    );

    expect(positions).toEqual([
      { isin: WORLD.symbol, name: WORLD.name, shares: 15, costBasis: 802 },
      { isin: EUROPE.symbol, name: EUROPE.name, shares: 2.5, costBasis: 50 },
    ]);
  });

  test("reduces the cost basis proportionally on a partial sale", () => {
    const [position] = positionsOf(
      buy(WORLD, "2024-01-03T10:00:00.000Z", 10, 50, 0),
      buy(WORLD, "2024-02-03T10:00:00.000Z", 10, 70, 0),
      sell(WORLD, "2024-03-03T10:00:00.000Z", 5, 80),
    );

    expect(position?.shares).toBe(15);
    expect(position?.costBasis).toBeCloseTo(900);
  });

  test("drops fully sold positions, including fractional leftovers", () => {
    const positions = positionsOf(
      buy(WORLD, "2024-01-03T10:00:00.000Z", 1.2345, 50),
      sell(WORLD, "2024-03-03T10:00:00.000Z", 1.2345, 80),
      buy(EUROPE, "2024-01-03T10:00:00.000Z", 1, 20),
    );
    expect(positions.map((p) => p.isin)).toEqual([EUROPE.symbol]);
  });

  test("starts from zero again after a position was closed", () => {
    const [position] = positionsOf(
      buy(WORLD, "2024-01-03T10:00:00.000Z", 2, 50, 0),
      sell(WORLD, "2024-02-03T10:00:00.000Z", 2, 80),
      buy(WORLD, "2024-03-03T10:00:00.000Z", 1, 90, 0),
    );
    expect(position).toMatchObject({ shares: 1, costBasis: 90 });
  });

  test("reverses a cancelled buy", () => {
    const cancelled = row({
      datetime: "2024-01-04T10:00:00.000Z",
      category: "TRADING",
      type: "BUY_CANCELLED",
      assetClass: "FUND",
      ...WORLD,
      shares: "-1.0000000000",
      price: "50.000000",
      amount: "50.00",
    });
    const [position] = positionsOf(buy(WORLD, "2024-01-03T10:00:00.000Z", 3, 50, 0), cancelled);
    expect(position).toMatchObject({ shares: 2, costBasis: 100 });
  });
});
