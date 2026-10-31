/** Number of categorical chart colors (--chart-1 … --chart-8). */
export const SERIES_COUNT = 8;

export const OTHER_COLOR = "var(--chart-other)";

/** Categorical color in fixed order; everything past the palette is "other". */
export function seriesColor(index: number): string {
  return index < SERIES_COUNT ? `var(--chart-${index + 1})` : OTHER_COLOR;
}

/** Number of neutral rank colors (--rank-1 … --rank-7). */
export const RANK_COUNT = 7;

export const RANK_OTHER_COLOR = "var(--rank-other)";

/**
 * Neutral ramp from dark to light for ranked parts (regions, countries, companies),
 * so that hues stay reserved for the ETFs.
 */
export function rankColor(index: number): string {
  return index < RANK_COUNT ? `var(--rank-${index + 1})` : RANK_OTHER_COLOR;
}
