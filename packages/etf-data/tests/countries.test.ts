import { expect, test } from "vite-plus/test";
import { countryCodeFromGermanName } from "../src/index.ts";

test.each([
  ["Vereinigte Staaten", "US"],
  ["Vereinigtes Königreich", "GB"],
  ["Österreich", "AT"],
  ["Südafrika", "ZA"],
  ["Europäische Union", "EU"],
  ["Hongkong", "HK"],
  ["Korea", "KR"],
  ["Qatar", "QA"],
  ["Ver. Arabische Emirate", "AE"],
])("%s → %s", (name, code) => {
  expect(countryCodeFromGermanName(name)).toBe(code);
});

test("returns undefined for unknown names", () => {
  expect(countryCodeFromGermanName("Atlantis")).toBeUndefined();
});
