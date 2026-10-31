import { expect, test } from "vite-plus/test";
import { parseEcbRates } from "../src/index.ts";

test("parses the ECB daily reference rates", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube>
    <Cube time='2026-10-30'>
      <Cube currency='USD' rate='1.1000'/>
      <Cube currency='JPY' rate='160.50'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

  expect(parseEcbRates(xml)).toEqual({
    asOf: "2026-10-30",
    perEur: { EUR: 1, USD: 1.1, JPY: 160.5 },
  });
});

test("fails without rates", () => {
  expect(() => parseEcbRates("<Cube time='2026-10-30'></Cube>")).toThrow(/no rates/);
});
