import { describe, expect, test } from "vite-plus/test";
import { regionOf } from "../src/index.ts";

describe("regionOf", () => {
  test("knows countries outside the common indices", () => {
    expect(["ET", "VE", "UZ", "FJ", "XK", "PS"].map(regionOf)).toEqual([
      "africa",
      "latin-america",
      "asia",
      "oceania",
      "europe",
      "middle-east",
    ]);
  });
});
