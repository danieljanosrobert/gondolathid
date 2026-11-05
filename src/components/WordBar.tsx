import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./WordBar.module.css";
import type { ColorScheme } from "../lib/theme";
import {
  packSuggestionRowsForWidth,
  readSuggestionLayoutMetrics,
  type ChipLayoutMetrics,
} from "../lib/suggestionLayout";

const DEFAULT_METRICS: ChipLayoutMetrics = {
  containerWidthPx: 0,
  containerHeightPx: 0,
  rowMinHeightPx: 44,
  fontSizePx: 16,
  fontWeight: "600",
  fontFamily: "system-ui, sans-serif",
  paddingXPx: 8,
  gapPx: 7,
};

function layoutMetricsEqual(a: ChipLayoutMetrics, b: ChipLayoutMetrics): boolean {
  return (
    a.containerWidthPx === b.containerWidthPx &&
    a.containerHeightPx === b.containerHeightPx &&
    a.rowMinHeightPx === b.rowMinHeightPx &&
    a.fontSizePx === b.fontSizePx &&
    a.fontWeight === b.fontWeight &&
    a.fontFamily === b.fontFamily &&
    a.paddingXPx === b.paddingXPx &&
    a.gapPx === b.gapPx
  );
}

function useSuggestionLayoutMetrics(depsKey: number): {
  wrapRef: (node: HTMLDivElement | null) => void;
  metrics: ChipLayoutMetrics;
} {
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<ChipLayoutMetrics>(DEFAULT_METRICS);

  useEffect(() => {
    if (!wrap) return;

    const update = () => {
      const next = readSuggestionLayoutMetrics(wrap);
      setMetrics((prev) => (layoutMetricsEqual(prev, next) ? prev : next));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [wrap, depsKey]);

  return { wrapRef: setWrap, metrics };
}

type Props = {
  composedText: string;
  prefix: string;
  suggestions: string[];
  onPickWord: (word: string) => void;
  loadHint?: string;
  placeholder?: string;
  colorScheme: ColorScheme;
  onColorSchemeToggle: () => void;
};

function chipCharsStyle(word: string): CSSProperties {
  const n = Math.max(word.length, 1);
  return { ["--chip-chars" as string]: String(n) };
}

export function WordBar({
  composedText,
  prefix,
  suggestions,
  onPickWord,
  loadHint,
  placeholder = "Kezdj el betűzni…",
  colorScheme,
  onColorSchemeToggle,
}: Props) {
  const layoutKey = suggestions.length ^ (prefix.length << 4);
  const { wrapRef, metrics } = useSuggestionLayoutMetrics(layoutKey);
  const draft = composedText + prefix;

  const rows = useMemo(
    () => packSuggestionRowsForWidth(suggestions, metrics),
    [suggestions, metrics],
  );

  return (
    <header className={styles.bar}>
      <ThemeToggle scheme={colorScheme} onToggle={onColorSchemeToggle} />
      <div
        className={styles.textArea}
        aria-live="polite"
        aria-readonly="true"
        role="document"
      >
        {draft || (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        {loadHint ? (
          <span className={styles.loadHint}>{loadHint}</span>
        ) : null}
      </div>
      <div ref={wrapRef} className={styles.suggestionsWrap}>
        <div
          className={styles.suggestions}
          data-suggestion-list
          role="list"
        >
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={styles.suggestionRow}
              role="presentation"
            >
              {row.map((word) => (
                <button
                  key={word}
                  type="button"
                  className={styles.chip}
                  style={chipCharsStyle(word)}
                  role="listitem"
                  onClick={() => onPickWord(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
