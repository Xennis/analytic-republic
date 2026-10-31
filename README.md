# Analytic Republic

Local web app that reads a Trade Republic transaction export (CSV) and uses a look-through analysis to show how the ETFs in the portfolio are spread across regions, countries and companies.

The CSV file is only processed in the browser and never uploaded anywhere.

> Private project, not affiliated with Trade Republic or BlackRock/iShares. Not investment advice.

## Requirements

- Node.js ≥ 22.18
- pnpm

## Getting started

```bash
pnpm install
pnpm fetch-data   # downloads ETF holdings and NAVs from iShares plus ECB exchange rates
pnpm dev          # starts the app on http://localhost:5173
```

Then drop the Trade Republic export into the app. Run `pnpm fetch-data` again whenever you want fresh data. The cache in `packages/etf-data/cache/` is not committed.

## Adding an ETF

If the export contains an ETF without data, the app shows a notice. Add its ISIN and iShares portfolio id (the number in the product page URL, e.g. `…/produkte/123456/…`) to [`packages/etf-data/src/registry.ts`](packages/etf-data/src/registry.ts) and run `pnpm fetch-data`. Other providers need their own adapter next to `providers/ishares.ts`.

## Development

| Command      | Purpose                                       |
| ------------ | --------------------------------------------- |
| `pnpm check` | Formatting, linting and type checking (Vite+) |
| `pnpm test`  | Tests of all packages                         |
| `pnpm build` | Production build of the app                   |

| Package                  | Contents                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `packages/traderepublic` | CSV parser and position derivation                                |
| `packages/etf-data`      | Data model, fund registry, iShares and ECB adapters, fetch script |
| `packages/portfolio`     | Valuation, look-through, regions and companies                    |
| `apps/web`               | React app with shadcn/ui and Recharts                             |
