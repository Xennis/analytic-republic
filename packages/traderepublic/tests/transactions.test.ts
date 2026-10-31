import { describe, expect, test } from "vite-plus/test";
import { parseTransactions, TradeRepublicParseError } from "../src/index.ts";
import { buy, csv, deposit, row, sell, WORLD } from "./fixtures.ts";

describe("parseTransactions", () => {
  test("parses fund trades and ignores cash movements", () => {
    const transactions = parseTransactions(
      csv(deposit, buy(WORLD, "2024-01-03T10:00:00.000Z", 10, 50)),
    );

    expect(transactions).toEqual([
      {
        datetime: new Date("2024-01-03T10:00:00.000Z"),
        type: "BUY",
        isin: WORLD.symbol,
        name: WORLD.name,
        shares: 10,
        amount: -500,
        fee: -1,
      },
    ]);
  });

  test("does not expose personal columns", () => {
    const [transaction] = parseTransactions(
      csv(deposit, buy(WORLD, "2024-01-03T10:00:00.000Z", 1, 50)),
    );
    expect(Object.keys(transaction!).sort()).toEqual(
      ["amount", "datetime", "fee", "isin", "name", "shares", "type"].sort(),
    );
  });

  test("sorts transactions chronologically", () => {
    const transactions = parseTransactions(
      csv(
        sell(WORLD, "2024-03-01T10:00:00.000Z", 1, 60),
        buy(WORLD, "2024-01-03T10:00:00.000Z", 2, 50),
      ),
    );
    expect(transactions.map((tx) => tx.type)).toEqual(["BUY", "SELL"]);
  });

  test("ignores fund events that are not trades", () => {
    const earnings = row({
      datetime: "2024-02-01T10:00:00.000Z",
      category: "CASH",
      type: "EARNINGS",
      assetClass: "FUND",
      ...WORLD,
      amount: "0.000000",
      tax: "-3.00",
    });
    expect(parseTransactions(csv(earnings))).toEqual([]);
  });

  test("handles a byte order mark and an empty fee", () => {
    const transactions = parseTransactions(
      "﻿" + csv(buy(WORLD, "2024-01-03T10:00:00.000Z", 1, 50, 0)),
    );
    expect(transactions[0]?.fee).toBe(0);
  });

  test("rejects files with missing columns", () => {
    expect(() => parseTransactions('"date","amount"\n"2024-01-01","1"\n')).toThrow(
      TradeRepublicParseError,
    );
  });

  test("reports the line of an invalid trade", () => {
    const broken = buy(WORLD, "2024-01-03T10:00:00.000Z", 1, 50).replace(WORLD.symbol, "XX");
    expect(() => parseTransactions(csv(deposit, broken))).toThrow(/Zeile 3/);
  });
});
