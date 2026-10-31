# Analytic Republic

Local web app that reads a Trade Republic transaction export (CSV) and uses a look-through analysis to show how the ETFs in the portfolio are spread across regions, countries, sectors and companies, and compares the countries and sectors with world GDP and the world equity market.

The CSV file is only processed in the browser and never uploaded anywhere.

> Private project, not affiliated with Trade Republic or BlackRock/iShares. Not investment advice.

## Requirements

- Node.js ≥ 22.18
- pnpm

## Getting started

```bash
pnpm install
pnpm fetch-data ~/Downloads/export.csv   # downloads data of the ETFs in the export
pnpm dev                                 # starts the app on http://localhost:5173
```

Then drop the same Trade Republic export into the app.

`pnpm fetch-data` reads the ISINs of the current positions from the export, looks them up via the iShares product search and downloads their holdings and NAVs plus ECB exchange rates. Run it again with a new export after buying another ETF, or without arguments to refresh the data of the funds fetched before. It also downloads the GDP of all countries from the IMF World Economic Outlook (last completed year) and the holdings of the iShares MSCI ACWI as the world equity market to compare with. Everything ends up in `packages/etf-data/cache/` (including the ISIN → portfolio id mapping in `fund-refs.json`), which is not committed. Only the ISINs are sent to iShares, never the export itself.

ETFs from other providers are reported as not found. They need their own adapter next to `providers/ishares.ts`.

## Development

| Command      | Purpose                                       |
| ------------ | --------------------------------------------- |
| `pnpm check` | Formatting, linting and type checking (Vite+) |
| `pnpm test`  | Tests of all packages                         |
| `pnpm build` | Production build of the app                   |

| Package                  | Contents                                                                   |
| ------------------------ | -------------------------------------------------------------------------- |
| `packages/traderepublic` | CSV parser and position derivation                                         |
| `packages/etf-data`      | Data model, iShares, ECB and IMF adapters, fetch script                    |
| `packages/portfolio`     | Valuation, look-through, regions, sectors, companies, benchmark comparison |
| `apps/web`               | React app with shadcn/ui and Recharts                                      |
