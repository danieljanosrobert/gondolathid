import type { WordFreq } from "./trie";

/** Relative to site root (GitHub Pages base path included). */
export function extraWordsUrl(): string {
  return `${import.meta.env.BASE_URL}data/extra-words.txt`;
}

/** Trie weight ≈ 80% of a typical strong corpus hit (ranking only, not UI). */
const CORPUS_NOMINAL_FREQ = 1000;
export const EXTRA_WORD_SUGGEST_FREQ = Math.round(CORPUS_NOMINAL_FREQ * 0.8);

export function parseExtraWordsText(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\n/)) {
    const raw = line.trim();
    if (!raw) continue;
    const word = raw.toLocaleLowerCase("hu");
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

export function extraWordsToFreq(entries: readonly string[]): WordFreq[] {
  return entries.map((word) => ({
    word,
    freq: EXTRA_WORD_SUGGEST_FREQ,
  }));
}
