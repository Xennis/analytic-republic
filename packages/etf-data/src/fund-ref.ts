export type IsharesFundRef = {
  isin: string;
  provider: "ishares";
  /** Numeric id in the iShares product page URL, e.g. /produkte/123456/... */
  portfolioId: number;
};

/** Where to download a fund from. Resolved from its ISIN by the fetch script. */
export type FundRef = IsharesFundRef;
