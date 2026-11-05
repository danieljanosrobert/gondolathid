import { orderWordStartTokens } from "./graphemes";
import {
  buildTrie,
  collectPrefixEndNodes,
  createTrieNode,
  insertWord,
  mergeNextWeights,
  mergeSuggestions,
  sortedNextTokens,
  weightsToSortedLetters,
  type TrieNode,
  type WordFreq,
} from "./trie";

export type DictionaryEngine = {
  trie: TrieNode;
  globalLetterFreq: string[];
  graphemes: readonly string[];
  locale: string;
  nextLetters(prefix: string): string[];
  suggestWords(prefix: string, limit?: number): string[];
  topWords(limit?: number): string[];
  hasWord(word: string): boolean;
};

function topWordsFromTrie(root: TrieNode, limit: number): string[] {
  const merged: WordFreq[] = [];
  for (const child of root.children.values()) {
    merged.push(...child.suggestions);
  }
  merged.sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word, "hu"));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { word } of merged) {
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}

function buildGlobalLetterFreq(entries: WordFreq[], locale: string): string[] {
  const counts = new Map<string, number>();
  for (const { word, freq } of entries) {
    if (freq <= 0) continue;
    for (const ch of word) {
      counts.set(ch, (counts.get(ch) ?? 0) + freq);
    }
  }
  return weightsToSortedLetters(counts, locale);
}

function lettersOnlyTokens(
  tokens: string[],
  graphemes: readonly string[],
): string[] {
  if (graphemes.length > 0) return tokens;
  return tokens.filter((t) => t.length === 1);
}

function nextTokensForPrefix(
  trie: TrieNode,
  prefix: string,
  graphemes: readonly string[],
  locale: string,
): string[] {
  const nodes = collectPrefixEndNodes(trie, prefix, graphemes);
  if (nodes.length === 0) return [];
  const tokens = sortedNextTokens(nodes, locale);
  return lettersOnlyTokens(tokens, graphemes);
}

function hasWordAt(
  engine: DictionaryEngine,
  word: string,
  graphemes: readonly string[],
): boolean {
  if (!word) return false;
  const nodes = collectPrefixEndNodes(engine.trie, word, graphemes);
  return nodes.some((n) => n.suggestions.some((s) => s.word === word));
}

function nextLettersAt(
  engine: DictionaryEngine,
  prefix: string,
  graphemes: readonly string[],
): string[] {
  if (!prefix) {
    const weights = mergeNextWeights(
      collectPrefixEndNodes(engine.trie, prefix, graphemes),
    );
    return orderWordStartTokens(
      weights,
      engine.globalLetterFreq,
      graphemes,
      engine.locale,
      weights.size === 0,
    );
  }
  return nextTokensForPrefix(engine.trie, prefix, graphemes, engine.locale);
}

function makeEngine(
  trie: TrieNode,
  globalLetterFreq: string[],
  graphemes: readonly string[],
  locale: string,
): DictionaryEngine {
  return {
    trie,
    globalLetterFreq,
    graphemes,
    locale,
    nextLetters(prefix: string) {
      if (!prefix) {
        const weights = mergeNextWeights(
          collectPrefixEndNodes(trie, prefix, graphemes),
        );
        return orderWordStartTokens(
          weights,
          globalLetterFreq,
          graphemes,
          locale,
          weights.size === 0,
        );
      }
      return nextTokensForPrefix(trie, prefix, graphemes, locale);
    },
    suggestWords(prefix: string, limit = 5) {
      if (!prefix) return [];
      const nodes = collectPrefixEndNodes(trie, prefix, graphemes);
      if (nodes.length === 0) return [];
      return mergeSuggestions(nodes, limit * 3)
        .filter((s) => s.word.startsWith(prefix))
        .slice(0, limit)
        .map((s) => s.word);
    },
    topWords(limit = 5) {
      return topWordsFromTrie(trie, limit);
    },
    hasWord(word: string) {
      if (!word) return false;
      const nodes = collectPrefixEndNodes(trie, word, graphemes);
      return nodes.some((n) =>
        n.suggestions.some((s) => s.word === word),
      );
    },
  };
}

export function createDictionaryEngine(
  entries: WordFreq[],
  graphemes: readonly string[],
  locale: string,
  globalLetterFreq?: string[],
): DictionaryEngine {
  const trie = buildTrie(entries, graphemes);
  const global =
    globalLetterFreq && globalLetterFreq.length > 0
      ? globalLetterFreq
      : buildGlobalLetterFreq(entries, locale);

  return makeEngine(trie, global, graphemes, locale);
}

export function createEmptyEngine(
  globalLetterFreq: string[],
  graphemes: readonly string[],
  locale: string,
): DictionaryEngine {
  return makeEngine(createTrieNode(), globalLetterFreq, graphemes, locale);
}

export function appendToEngine(
  engine: DictionaryEngine,
  batch: WordFreq[],
): void {
  for (const { word, freq } of batch) {
    insertWord(
      engine.trie,
      word,
      freq,
      freq > 0,
      engine.graphemes,
    );
  }
}

/** Max. szójavaslat — a chip-ek száma a rendelkezésre álló helytől függ. */
export const SUGGESTION_LIMIT = 48;

function uniqueWords(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

export function buildSuggestions(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  graphemes: readonly string[],
): string[] {
  const limit = SUGGESTION_LIMIT;
  const raw = prefix
    ? (() => {
        const nodes = collectPrefixEndNodes(engine.trie, prefix, graphemes);
        if (nodes.length === 0) return [];
        return uniqueWords(
          mergeSuggestions(nodes, limit * 3)
            .filter((s) => s.word.startsWith(prefix))
            .slice(0, limit + 8)
            .map((s) => s.word),
        );
      })()
    : engine.topWords(limit + 8);
  return uniqueWords(raw.filter((w) => w !== finishWord)).slice(0, limit);
}

/** 1 betűs prefix: min(megjelenő betűk száma, ez). */
export const MAX_FINISH_DEFER_INDEX_LEN1 = 10;
/** 2 betűs prefix: min(megjelenő betűk száma, ez). */
export const MAX_FINISH_DEFER_INDEX_LEN2 = 7;
/** 3 betűs prefix: min(megjelenő betűk száma, ez). */
export const MAX_FINISH_DEFER_INDEX_LEN3 = 4;
/** Ennél hosszabb prefixnél a befejezés gomb az első helyen. */
export const FINISH_FIRST_AT_PREFIX_LENGTH = 4;

function maxFinishDeferCap(prefixLength: number): number {
  if (prefixLength === 1) return MAX_FINISH_DEFER_INDEX_LEN1;
  if (prefixLength === 2) return MAX_FINISH_DEFER_INDEX_LEN2;
  if (prefixLength === 3) return MAX_FINISH_DEFER_INDEX_LEN3;
  return 0;
}

export function isDeferredSingleLetterFinish(
  prefix: string,
  singleLetterFinishPrefixes: readonly string[],
): boolean {
  return (
    prefix.length === 1 && singleLetterFinishPrefixes.includes(prefix)
  );
}

export function finishKeyInsertIndex(
  prefix: string,
  visibleLetterCount: number,
): number {
  const len = prefix.length;
  if (len >= FINISH_FIRST_AT_PREFIX_LENGTH) return 0;
  if (len <= 0) return 0;
  return Math.min(visibleLetterCount, maxFinishDeferCap(len));
}

export function shouldShowFinishKey(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  singleLetterFinishPrefixes: readonly string[],
  graphemes: readonly string[],
): boolean {
  if (!hasWordAt(engine, finishWord, graphemes)) return false;
  if (isDeferredSingleLetterFinish(prefix, singleLetterFinishPrefixes)) {
    return true;
  }
  if (prefix.length < 2) return false;
  if (nextLettersAt(engine, prefix, graphemes).length === 0) return true;
  return hasWordAt(engine, prefix, graphemes);
}

export function shouldHidePredictiveLetters(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  _singleLetterFinishPrefixes: readonly string[],
  graphemes: readonly string[],
): boolean {
  if (!hasWordAt(engine, finishWord, graphemes)) return false;
  if (prefix.length < 2) return false;
  return nextLettersAt(engine, prefix, graphemes).length === 0;
}

export function predictiveLettersForPrefix(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  fallbackGlobal: string[],
  singleLetterFinishPrefixes: readonly string[],
  dictionaryLoading: boolean,
  graphemes: readonly string[],
): string[] {
  if (
    shouldHidePredictiveLetters(
      engine,
      prefix,
      finishWord,
      singleLetterFinishPrefixes,
      graphemes,
    )
  ) {
    return [];
  }

  const tokens = nextTokensForPrefix(
    engine.trie,
    prefix,
    graphemes,
    engine.locale,
  );
  if (tokens.length === 0 && prefix) return [];

  if (!prefix) {
    const fallback =
      engine.globalLetterFreq.length > 0
        ? engine.globalLetterFreq
        : fallbackGlobal;
    const weights = mergeNextWeights(
      collectPrefixEndNodes(engine.trie, prefix, graphemes),
    );
    return lettersOnlyTokens(
      orderWordStartTokens(
        weights,
        fallback,
        graphemes,
        engine.locale,
        dictionaryLoading,
      ),
      graphemes,
    );
  }

  return tokens;
}

/** Gyakoriság-súlyozott betűsor első ~12 karaktere (debug / teszt). */
export function letterOrderPreview(entries: WordFreq[], take = 12): string {
  return buildGlobalLetterFreq(entries, "hu").slice(0, take).join("");
}
