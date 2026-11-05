export type ChipLayoutMetrics = {
  containerWidthPx: number;
  containerHeightPx: number;
  rowMinHeightPx: number;
  fontSizePx: number;
  fontWeight: string;
  fontFamily: string;
  paddingXPx: number;
  gapPx: number;
};

/**
 * Soronkénti karakterlimit aránya a nyers kapacitáshoz képest.
 * Kisebb érték → kevesebb szó/sor → szélesebb chip → egy soros felirat.
 */
const ROW_CHAR_CAPACITY_FRACTION = 0.38;

const FALLBACK_CHAR_WIDTH_RATIO = 0.58;

export function averageCharWidthPx(metrics: Pick<
  ChipLayoutMetrics,
  "fontSizePx" | "fontWeight" | "fontFamily"
>): number {
  if (typeof document === "undefined") {
    return metrics.fontSizePx * FALLBACK_CHAR_WIDTH_RATIO;
  }
  const font = `${metrics.fontWeight} ${metrics.fontSizePx}px ${metrics.fontFamily}`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return metrics.fontSizePx * FALLBACK_CHAR_WIDTH_RATIO;
  ctx.font = font;
  const sample = "szépmagyaráéültőcszdzs";
  const w = ctx.measureText(sample).width;
  return w / sample.length;
}

export function estimateChipWidthPx(
  word: string,
  charWidthPx: number,
  paddingXPx: number,
): number {
  return Math.max(word.length, 1) * charWidthPx + 2 * paddingXPx;
}

/** Reszponzív: max. összes karakter/sor (szóhosszok összege). */
export function maxCharsPerRow(metrics: ChipLayoutMetrics): number {
  const w = metrics.containerWidthPx;
  if (w <= 0) return 10;
  const charW = averageCharWidthPx(metrics);
  const raw = Math.floor((w - 2 * metrics.paddingXPx) / charW);
  const cap = Math.floor(raw * ROW_CHAR_CAPACITY_FRACTION);
  return Math.max(6, cap);
}

/** Hány chip-sor fér el görgetés nélkül. */
export function maxVisibleRows(metrics: ChipLayoutMetrics): number {
  const { containerHeightPx, rowMinHeightPx, gapPx } = metrics;
  if (containerHeightPx <= 0 || rowMinHeightPx <= 0) return 1;
  const slot = rowMinHeightPx + gapPx;
  return Math.max(1, Math.floor((containerHeightPx + gapPx) / slot));
}

/**
 * Sorok tördelése: px + soronkénti karakterlimit (AAC: teljes szó, egy sor a chipen).
 * Csak annyi sor, amennyi a magasság engedi — nincs görgetés.
 */
export function packSuggestionRowsForWidth(
  words: readonly string[],
  metrics: ChipLayoutMetrics,
): string[][] {
  const width = metrics.containerWidthPx;
  if (width <= 0 || words.length === 0) return [];

  const maxRows = maxVisibleRows(metrics);
  const charW = averageCharWidthPx(metrics);
  const charCap = maxCharsPerRow(metrics);
  const rows: string[][] = [];
  let row: string[] = [];
  let rowUsedPx = 0;
  let rowChars = 0;

  for (const word of words) {
    if (rows.length >= maxRows) break;

    const len = Math.max(word.length, 1);
    const chipW = estimateChipWidthPx(word, charW, metrics.paddingXPx);
    const gap = row.length > 0 ? metrics.gapPx : 0;
    const nextPx = rowUsedPx + gap + chipW;
    const nextChars = rowChars + len;

    const overflowPx = row.length > 0 && nextPx > width;
    const overflowChars = row.length > 0 && nextChars > charCap;

    if (overflowPx || overflowChars) {
      rows.push(row);
      if (rows.length >= maxRows) break;
      row = [word];
      rowUsedPx = chipW;
      rowChars = len;
      continue;
    }

    row.push(word);
    rowUsedPx = row.length === 1 ? chipW : nextPx;
    rowChars = nextChars;
  }

  if (row.length > 0 && rows.length < maxRows) rows.push(row);
  return rows;
}

export function readSuggestionLayoutMetrics(wrap: HTMLElement): ChipLayoutMetrics {
  const inner =
    (wrap.querySelector("[data-suggestion-list]") as HTMLElement | null) ??
    wrap;
  const cs = getComputedStyle(inner);
  const fontSizePx = parseCssPx(
    cs.getPropertyValue("--chip-font-size").trim(),
    cs.fontSize,
  );
  const paddingXPx = parseCssPx(
    cs.getPropertyValue("--chip-pad-x").trim(),
    "0.55rem",
  );
  const gapPx = parseCssPx(
    cs.getPropertyValue("--chip-gap").trim(),
    cs.gap || cs.rowGap,
  );
  const rowMinHeightPx = parseCssPx(
    cs.getPropertyValue("--suggestion-row-min-h").trim(),
    "2.75rem",
  );
  const fontWeight =
    cs.getPropertyValue("--chip-font-weight").trim() || cs.fontWeight || "600";
  const fontFamily = cs.fontFamily || "system-ui, sans-serif";

  return {
    containerWidthPx: wrap.clientWidth,
    containerHeightPx: wrap.clientHeight,
    rowMinHeightPx: rowMinHeightPx || 44,
    fontSizePx: fontSizePx || 16,
    fontWeight,
    fontFamily,
    paddingXPx: paddingXPx || 8,
    gapPx: gapPx >= 0 ? gapPx : 7,
  };
}

function parseCssPx(value: string, fallback: string): number {
  const v = value || fallback;
  if (!v) return 0;
  const num = parseFloat(v);
  if (Number.isNaN(num)) return 0;
  if (v.endsWith("rem")) {
    const root =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return num * root;
  }
  if (v.endsWith("px")) return num;
  return num;
}
