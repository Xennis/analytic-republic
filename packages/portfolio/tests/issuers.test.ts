import { expect, test } from "vite-plus/test";
import { companyName, issuerKey } from "../src/index.ts";

test.each([
  ["ALPHABET CLASS A", "ALPHABET"],
  ["ATLAS COPCO CLASS B", "ATLAS COPCO"],
  ["A P MOLLER MAERSK B", "A P MOLLER MAERSK"],
  ["BANCO BRADESCO PREF", "BANCO BRADESCO"],
  ["AIRPORTS OF THAILAND NON-VOTING DR", "AIRPORTS OF THAILAND"],
  ["APPLE", "APPLE"],
])("companyName(%s) = %s", (name, expected) => {
  expect(companyName(name)).toBe(expected);
});

test("share classes and legal forms of a company share one key", () => {
  expect(issuerKey("ALPHABET INC CLASS A", "US")).toBe(issuerKey("ALPHABET CLASS C", "US"));
  expect(issuerKey("SAP SE", "DE")).toBe(issuerKey("SAP", "DE"));
});

test("companies with the same name in different countries stay apart", () => {
  expect(issuerKey("EXAMPLE", "US")).not.toBe(issuerKey("EXAMPLE", "DE"));
});
