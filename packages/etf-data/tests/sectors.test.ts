import { expect, test } from "vite-plus/test";
import { isSectorId } from "../src/index.ts";

test("recognizes GICS sector ids", () => {
  expect(isSectorId("information-technology")).toBe(true);
  expect(isSectorId("IT")).toBe(false);
  expect(isSectorId(undefined)).toBe(false);
});
