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
};

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

/** Gyakoriság-súlyozott betűsor első ~12 karaktere (debug / teszt). */
export function letterOrderPreview(entries: WordFreq[], take = 12): string {
  return buildGlobalLetterFreq(entries).slice(0, take).join("");
}
