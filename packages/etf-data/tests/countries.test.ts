import { expect, test } from "vite-plus/test";
import { countryCodeFromGermanName, countryCodeInEnglishText } from "../src/index.ts";

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

test.each([
  ["ISHARES MSCI BRAZIL UCITS ET USDHA", "BR"],
  ["ISHARES MSCI SAUDI ARABIA CAPPED", "SA"],
  ["ISHARES MSCI SOUTH AFRICA", "ZA"],
  ["ISHARES MSCI KOREA", "KR"],
])("finds the country in %s", (text, code) => {
  expect(countryCodeInEnglishText(text)).toBe(code);
});

test("returns undefined for texts without a country", () => {
  expect(countryCodeInEnglishText("ISHARES MSCI EM UCITS ETF")).toBeUndefined();
});
