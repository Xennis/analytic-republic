export type IsharesFundRef = {
  isin: string;
  provider: "ishares";
  /** Numeric id in the iShares product page URL, e.g. /produkte/123456/... */
  portfolioId: number;
};

/** Where to download a fund from. Resolved from its ISIN by the fetch script. */
export type FundRef = IsharesFundRef;

/** iShares MSCI ACWI UCITS ETF, the world equity market the portfolio is compared with. */
export const WORLD_BENCHMARK: IsharesFundRef = {
  isin: "IE00B6R52259",
  provider: "ishares",
  portfolioId: 251850,
};
