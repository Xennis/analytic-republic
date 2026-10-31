export type IsharesFundRef = {
  isin: string;
  provider: "ishares";
  /** Numeric id in the iShares product page URL, e.g. /produkte/123456/... */
  portfolioId: number;
};

export type FundRef = IsharesFundRef;

/**
 * All funds the fetch script downloads. Add an entry here when a new ETF shows up in
 * the Trade Republic export.
 */
export const funds: readonly FundRef[] = [];
