// Synthetic rows in the format of a Trade Republic export. All values are made up.
const HEADER =
  '"datetime","date","account_type","category","type","asset_class","name","symbol","shares","price","amount","fee","tax","currency","original_amount","original_currency","fx_rate","description","transaction_id","counterparty_name","counterparty_iban","payment_reference","mcc_code"';

type Row = {
  datetime: string;
  category: string;
  type: string;
  assetClass?: string;
  name?: string;
  symbol?: string;
  shares?: string;
  price?: string;
  amount: string;
  fee?: string;
  tax?: string;
  counterpartyName?: string;
  counterpartyIban?: string;
};

export function row(r: Row): string {
  const fields = [
    r.datetime,
    r.datetime.slice(0, 10),
    "DEFAULT",
    r.category,
    r.type,
    r.assetClass ?? "",
    r.name ?? "",
    r.symbol ?? "",
    r.shares ?? "",
    r.price ?? "",
    r.amount,
    r.fee ?? "",
    r.tax ?? "",
    "EUR",
    "",
    "",
    "",
    "",
    "00000000-0000-0000-0000-000000000000",
    r.counterpartyName ?? "",
    r.counterpartyIban ?? "",
    "",
    "",
  ];
  return fields.map((field) => `"${field}"`).join(",");
}

export function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n") + "\n";
}

export const WORLD = { name: "Example World USD (Acc)", symbol: "IE0000000001" };
export const EUROPE = { name: "Example Europe EUR (Acc)", symbol: "IE0000000002" };

export const deposit = row({
  datetime: "2024-01-02T09:00:00.000Z",
  category: "CASH",
  type: "CUSTOMER_INBOUND",
  amount: "1000.000000",
  counterpartyName: "MAX MUSTERMANN",
  counterpartyIban: "DE00000000000000000000",
});

export function buy(
  fund: typeof WORLD,
  datetime: string,
  shares: number,
  price: number,
  fee = 1,
): string {
  return row({
    datetime,
    category: "TRADING",
    type: "BUY",
    assetClass: "FUND",
    ...fund,
    shares: shares.toFixed(10),
    price: price.toFixed(6),
    amount: (-shares * price).toFixed(2),
    fee: fee ? (-fee).toFixed(2) : "",
  });
}

export function sell(
  fund: typeof WORLD,
  datetime: string,
  shares: number,
  price: number,
  fee = 1,
): string {
  return row({
    datetime,
    category: "TRADING",
    type: "SELL",
    assetClass: "FUND",
    ...fund,
    shares: (-shares).toFixed(10),
    price: price.toFixed(6),
    amount: (shares * price).toFixed(2),
    fee: fee ? (-fee).toFixed(2) : "",
    tax: "-1.50",
  });
}
