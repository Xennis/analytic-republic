import { derivePositions, parseTransactions } from "@analytic-republic/traderepublic";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CsvDropzone } from "@/components/CsvDropzone";
import { FundAllocation } from "@/components/FundAllocation";
import { KpiCards } from "@/components/KpiCards";
import { RegionBreakdown } from "@/components/RegionBreakdown";
import { TopCompanies } from "@/components/TopCompanies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cachedFunds, cachedFx } from "@/lib/fund-data";
import { formatDate } from "@/lib/format";
import { analyze } from "@/lib/portfolio";

type Upload = { fileName: string; csv: string };

function dataStatus(): string | undefined {
  const funds = [...cachedFunds.values()];
  if (funds.length === 0 || !cachedFx) return undefined;
  const oldest = (dates: string[]) => dates.sort()[0]!;
  return [
    `Positionen vom ${formatDate(oldest(funds.map((fund) => fund.holdingsAsOf)))}`,
    `NAV vom ${formatDate(oldest(funds.map((fund) => fund.nav.asOf)))}`,
    `EZB-Kurse vom ${formatDate(cachedFx.asOf)}`,
  ].join(" · ");
}

export default function App() {
  const [upload, setUpload] = useState<Upload>();

  const result = useMemo(() => {
    if (!upload) return undefined;
    try {
      const positions = derivePositions(parseTransactions(upload.csv));
      return { analysis: analyze(positions, cachedFunds, cachedFx) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [upload]);

  const status = dataStatus();
  const analysis = result?.analysis;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytic Republic</h1>
          <p className="text-sm text-muted-foreground">
            {status ?? "Wo steckt dein Geld? Look-Through für deine ETFs."}
          </p>
        </div>
        {upload && (
          <Button variant="outline" onClick={() => setUpload(undefined)}>
            <RotateCcw /> Andere Datei
          </Button>
        )}
      </header>

      {!status && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Keine ETF-Daten gefunden</AlertTitle>
          <AlertDescription>
            <p>
              Lade die Zusammensetzung der ETFs einmalig herunter und starte die App neu:{" "}
              <code className="font-mono">pnpm fetch-data</code>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {!upload && (
        <CsvDropzone
          onFile={(file) => {
            void file.text().then((csv) => setUpload({ fileName: file.name, csv }));
          }}
        />
      )}

      {result?.error && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Die Datei konnte nicht gelesen werden</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {analysis && analysis.missing.length > 0 && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Für einige ETFs fehlen Daten</AlertTitle>
          <AlertDescription>
            <p>
              {analysis.missing.map((position) => `${position.name} (${position.isin})`).join(", ")}{" "}
              fließen nicht in die Auswertung ein. Ergänze sie in{" "}
              <code className="font-mono">packages/etf-data/src/registry.ts</code> und führe{" "}
              <code className="font-mono">pnpm fetch-data</code> aus.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <>
          <KpiCards totals={analysis.totals} companyCount={analysis.companies.length} />
          <FundAllocation
            positions={analysis.positions}
            funds={analysis.funds}
            total={analysis.totals.marketValue}
          />
          <RegionBreakdown key={upload?.fileName} root={analysis.regions} funds={analysis.funds} />
          <TopCompanies
            companies={analysis.companies}
            funds={analysis.funds}
            total={analysis.totals.marketValue}
          />
        </>
      )}
    </div>
  );
}
