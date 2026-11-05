import {
  buildTrie,
  createTrieNode,
  findNode,
  insertWord,
  weightsToSortedLetters,
  type TrieNode,
  type WordFreq,
} from "./trie";

export type DictionaryEngine = {
  trie: TrieNode;
  globalLetterFreq: string[];
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

function buildGlobalLetterFreq(entries: WordFreq[]): string[] {
  const counts = new Map<string, number>();
  for (const { word, freq } of entries) {
    if (freq <= 0) continue;
    for (const ch of word) {
      counts.set(ch, (counts.get(ch) ?? 0) + freq);
    }
  }
  return weightsToSortedLetters(counts);
}

export function createDictionaryEngine(
  entries: WordFreq[],
  globalLetterFreq?: string[],
): DictionaryEngine {
  const trie = buildTrie(entries);
  const global =
    globalLetterFreq && globalLetterFreq.length > 0
      ? globalLetterFreq
      : buildGlobalLetterFreq(entries);

  return makeEngine(trie, global);
}

function makeEngine(trie: TrieNode, globalLetterFreq: string[]): DictionaryEngine {
  return {
    trie,
    globalLetterFreq,
    nextLetters(prefix: string) {
      if (!prefix) return globalLetterFreq;
      const node = findNode(trie, prefix);
      if (!node) return [];
      return weightsToSortedLetters(node.nextWeights);
    },
    suggestWords(prefix: string, limit = 5) {
      if (!prefix) return [];
      const node = findNode(trie, prefix);
      if (!node) return [];
      return node.suggestions
        .filter((s) => s.word.startsWith(prefix))
        .slice(0, limit)
        .map((s) => s.word);
    },
    topWords(limit = 5) {
      return topWordsFromTrie(trie, limit);
    },
    hasWord(word: string) {
      if (!word) return false;
      const node = findNode(trie, word);
      if (!node) return false;
      return node.suggestions.some((s) => s.word === word);
    },
  };
}

export function createEmptyEngine(globalLetterFreq: string[]): DictionaryEngine {
  return makeEngine(createTrieNode(), globalLetterFreq);
}

export function appendToEngine(
  engine: DictionaryEngine,
  batch: WordFreq[],
): void {
  for (const { word, freq } of batch) {
    insertWord(engine.trie, word, freq, freq > 0);
  }
}

const SUGGESTION_LIMIT = 5;

export function buildSuggestions(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
): string[] {
  const limit = SUGGESTION_LIMIT;
  const raw = prefix
    ? engine.suggestWords(prefix, limit + 2)
    : engine.topWords(limit + 2);
  return raw.filter((w) => w !== finishWord).slice(0, limit);
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

/**
 * Where to splice the finish key among predictive letter keys (0 = first).
 * 1–3 betű: min(megjelenő betűk száma, felső határ); 4+: első hely.
 */
export function finishKeyInsertIndex(
  prefix: string,
  visibleLetterCount: number,
): number {
  const len = prefix.length;
  if (len >= FINISH_FIRST_AT_PREFIX_LENGTH) return 0;
  if (len <= 0) return 0;
  return Math.min(visibleLetterCount, maxFinishDeferCap(len));
}

/** Show the vége/gata key. Needs finish word in dictionary. */
export function shouldShowFinishKey(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  singleLetterFinishPrefixes: readonly string[],
): boolean {
  if (!engine.hasWord(finishWord)) return false;
  if (isDeferredSingleLetterFinish(prefix, singleLetterFinishPrefixes)) {
    return true;
  }
  if (prefix.length < 2) return false;
  if (engine.nextLetters(prefix).length === 0) return true;
  return engine.hasWord(prefix);
}

/** Hide other letter keys — only vége (e.g. gyíkot). */
export function shouldHidePredictiveLetters(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  _singleLetterFinishPrefixes: readonly string[],
): boolean {
  if (!engine.hasWord(finishWord)) return false;
  if (prefix.length < 2) return false;
  return engine.nextLetters(prefix).length === 0;
}

export function predictiveLettersForPrefix(
  engine: DictionaryEngine,
  prefix: string,
  finishWord: string,
  fallbackGlobal: string[],
  singleLetterFinishPrefixes: readonly string[],
): string[] {
  if (
    shouldHidePredictiveLetters(
      engine,
      prefix,
      finishWord,
      singleLetterFinishPrefixes,
    )
  ) {
    return [];
  }
  const letters = engine.nextLetters(prefix);
  if (letters.length > 0) return letters;
  if (!prefix) return fallbackGlobal;
  return [];
}

/** Gyakoriság-súlyozott betűsor első ~12 karaktere (debug / teszt). */
export function letterOrderPreview(entries: WordFreq[], take = 12): string {
  return buildGlobalLetterFreq(entries).slice(0, take).join("");
}
