import type { Holding, SectorId } from "@analytic-republic/etf-data";
import { companyName, issuerKey } from "./issuers.ts";
import { countryLabel, REGION_LABELS, regionOf } from "./regions.ts";
import { sectorLabel } from "./sectors.ts";
import type { ValuedPosition } from "./valuation.ts";

/** Part of one fund holding owned through one position, in EUR. */
export type Exposure = {
  fundIsin: string;
  holding: Holding;
  value: number;
};

export type BreakdownNode = {
  id: string;
  /** Short label for charts. */
  label: string;
  /** Longer label, e.g. for a hover title, when it differs from `label`. */
  fullLabel?: string;
  /** EUR */
  value: number;
  /** EUR per fund ISIN that contributes to this node. */
  byFund: Record<string, number>;
  /** ISO country code, set on company nodes. */
  country?: string;
  /** GICS sector, set on company nodes. */
  sector?: SectorId;
  /** Largest first. */
  children: BreakdownNode[];
};

export const CASH_NODE_ID = "cash";

/** Splits every valued position into its fund holdings. */
export function lookThrough(positions: readonly ValuedPosition[]): Exposure[] {
  return positions.flatMap((position) =>
    position.fund && position.marketValue !== undefined
      ? position.fund.holdings.map((holding) => ({
          fundIsin: position.isin,
          holding,
          value: position.marketValue! * holding.weight,
        }))
      : [],
  );
}

type MutableNode = Omit<BreakdownNode, "children"> & {
  children: Map<string, MutableNode>;
  /** Largest variant name, used to label companies. */
  labelWeight: number;
};

function createNode(id: string, label: string): MutableNode {
  return { id, label, value: 0, byFund: {}, children: new Map(), labelWeight: 0 };
}

function child(parent: MutableNode, id: string, label: string): MutableNode {
  let node = parent.children.get(id);
  if (!node) {
    node = createNode(id, label);
    parent.children.set(id, node);
  }
  return node;
}

function add(node: MutableNode, exposure: Exposure): void {
  node.value += exposure.value;
  node.byFund[exposure.fundIsin] = (node.byFund[exposure.fundIsin] ?? 0) + exposure.value;
}

function addCompany(parent: MutableNode, exposure: Exposure): void {
  const { holding } = exposure;
  const company = child(parent, issuerKey(holding.name, holding.country), "");
  add(company, exposure);
  company.country = holding.country;
  company.sector = holding.sector;
  if (exposure.value > company.labelWeight) {
    company.label = companyName(holding.name);
    company.labelWeight = exposure.value;
  }
}

function freeze(node: MutableNode): BreakdownNode {
  const frozen: BreakdownNode = {
    id: node.id,
    label: node.label,
    value: node.value,
    byFund: node.byFund,
    children: [...node.children.values()].map(freeze).sort((a, b) => b.value - a.value),
  };
  if (node.fullLabel) frozen.fullLabel = node.fullLabel;
  if (node.country) frozen.country = node.country;
  if (node.sector) frozen.sector = node.sector;
  return frozen;
}

function addCash(root: MutableNode, exposure: Exposure): void {
  const { holding } = exposure;
  const cash = child(root, CASH_NODE_ID, "Cash & Derivate");
  add(cash, exposure);
  add(child(cash, `${CASH_NODE_ID}:${holding.name}`, holding.name), exposure);
}

/**
 * Tree world → region → country → company. Cash and derivatives form a separate
 * top-level node, split by holding.
 */
export function breakdownByRegion(exposures: readonly Exposure[]): BreakdownNode {
  const root = createNode("world", "Welt");
  for (const exposure of exposures) {
    const { holding } = exposure;
    add(root, exposure);

    if (holding.kind !== "equity") {
      addCash(root, exposure);
      continue;
    }

    const regionId = regionOf(holding.country);
    const region = child(root, regionId, REGION_LABELS[regionId]);
    add(region, exposure);
    const country = child(region, holding.country ?? "??", countryLabel(holding.country));
    add(country, exposure);
    addCompany(country, exposure);
  }
  return freeze(root);
}

/**
 * Tree all → sector → company. Cash and derivatives form a separate top-level node,
 * split by holding.
 */
export function breakdownBySector(exposures: readonly Exposure[]): BreakdownNode {
  const root = createNode("sectors", "Alle Sektoren");
  for (const exposure of exposures) {
    const { holding } = exposure;
    add(root, exposure);

    if (holding.kind !== "equity") {
      addCash(root, exposure);
      continue;
    }

    const label = sectorLabel(holding.sector);
    const sector = child(root, holding.sector ?? "unknown", label.short);
    if (label.full !== label.short) sector.fullLabel = label.full;
    add(sector, exposure);
    addCompany(sector, exposure);
  }
  return freeze(root);
}

/** All equity companies across funds, largest first. */
export function companies(exposures: readonly Exposure[]): BreakdownNode[] {
  const root = createNode("companies", "Unternehmen");
  for (const exposure of exposures) {
    if (exposure.holding.kind === "equity") addCompany(root, exposure);
  }
  return freeze(root).children;
}
