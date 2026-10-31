/** Number of categorical chart colors (--chart-1 … --chart-8). */
export const SERIES_COUNT = 8;

export const OTHER_COLOR = "var(--chart-other)";

/** Categorical color in fixed order; everything past the palette is "other". */
export function seriesColor(index: number): string {
  return index < SERIES_COUNT ? `var(--chart-${index + 1})` : OTHER_COLOR;
}
