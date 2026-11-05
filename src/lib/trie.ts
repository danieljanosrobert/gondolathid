import { graphemesByLengthDesc, segmentWord } from "./graphemes";

export type WordFreq = { word: string; freq: number };

export type TrieNode = {
  children: Map<string, TrieNode>;
  /** Szavak, amelyek ezzel a prefixszel kezdődnek (gyakoriság szerint, max N) */
  suggestions: WordFreq[];
  nextWeights: Map<string, number>;
};

const MAX_SUGGESTIONS_PER_NODE = 100;

export function createTrieNode(): TrieNode {
  return { children: new Map(), suggestions: [], nextWeights: new Map() };
}

function upsertSuggestion(node: TrieNode, word: string, freq: number): void {
  const idx = node.suggestions.findIndex((s) => s.word === word);
  if (idx >= 0) {
    if (freq > node.suggestions[idx]!.freq) {
      node.suggestions[idx]!.freq = freq;
    }
  } else {
    node.suggestions.push({ word, freq });
  }
  node.suggestions.sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word, "hu"));
  if (node.suggestions.length > MAX_SUGGESTIONS_PER_NODE) {
    node.suggestions.length = MAX_SUGGESTIONS_PER_NODE;
  }
}

function insertAlongTokens(
  root: TrieNode,
  tokens: string[],
  word: string,
  freq: number,
  countForLetters: boolean,
): void {
  let node = root;
  for (const token of tokens) {
    if (countForLetters) {
      node.nextWeights.set(token, (node.nextWeights.get(token) ?? 0) + freq);
    }
    let child = node.children.get(token);
    if (!child) {
      child = createTrieNode();
      node.children.set(token, child);
    }
    node = child;
    upsertSuggestion(node, word, freq);
  }
}

/** Graféma-út + karakter-út; a betűút mindig számít a predikcióban. */
export function insertWord(
  root: TrieNode,
  word: string,
  freq: number,
  countForLetters: boolean,
  graphemes: readonly string[] = [],
): void {
  if (graphemes.length > 0) {
    insertAlongTokens(
      root,
      segmentWord(word, graphemes),
      word,
      freq,
      countForLetters,
    );
  }
  insertAlongTokens(root, [...word], word, freq, true);
}

export function buildTrie(
  entries: WordFreq[],
  graphemes: readonly string[] = [],
): TrieNode {
  const root = createTrieNode();
  for (const { word, freq } of entries) {
    insertWord(root, word, freq, freq > 0, graphemes);
  }
  return root;
}

/**
 * Minden trie-csomópont, ahová a prefix vezethet (graféma- vagy betűlépésekkel).
 */
export function collectPrefixEndNodes(
  root: TrieNode,
  prefix: string,
  graphemes: readonly string[],
): TrieNode[] {
  if (!prefix) return [root];
  const ends: TrieNode[] = [];
  const seen = new Set<TrieNode>();

  function addEnd(node: TrieNode) {
    if (!seen.has(node)) {
      seen.add(node);
      ends.push(node);
    }
  }

  function dfs(node: TrieNode, i: number) {
    if (i === prefix.length) {
      addEnd(node);
      return;
    }
    if (graphemes.length > 0) {
      for (const g of graphemesByLengthDesc(graphemes)) {
        if (g.length > 1 && prefix.startsWith(g, i)) {
          const child = node.children.get(g);
          if (child) dfs(child, i + g.length);
        }
      }
    }
    const ch = prefix[i]!;
    const child = node.children.get(ch);
    if (child) dfs(child, i + 1);
  }

  dfs(root, 0);
  return ends;
}

export function prefixHasPath(
  root: TrieNode,
  prefix: string,
  graphemes: readonly string[],
): boolean {
  return collectPrefixEndNodes(root, prefix, graphemes).length > 0;
}

export function mergeNextWeights(nodes: readonly TrieNode[]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const node of nodes) {
    for (const [token, w] of node.nextWeights) {
      merged.set(token, (merged.get(token) ?? 0) + w);
    }
  }
  return merged;
}

/** Következő gombok: súlyozott + létező gyerek (0 súlynál is, pl. s → z). */
export function sortedNextTokens(
  nodes: readonly TrieNode[],
  locale: string,
): string[] {
  const weights = mergeNextWeights(nodes);
  const rank = new Map<string, number>();
  for (const [token, w] of weights) {
    if (w > 0) rank.set(token, w);
  }
  for (const node of nodes) {
    for (const token of node.children.keys()) {
      if (!rank.has(token)) rank.set(token, 0);
    }
  }
  return [...rank.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .map(([token]) => token);
}

export function mergeSuggestions(
  nodes: readonly TrieNode[],
  limit: number,
): WordFreq[] {
  const byWord = new Map<string, number>();
  for (const node of nodes) {
    for (const s of node.suggestions) {
      byWord.set(s.word, Math.max(byWord.get(s.word) ?? 0, s.freq));
    }
  }
  return [...byWord.entries()]
    .map(([word, freq]) => ({ word, freq }))
    .sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word, "hu"))
    .slice(0, limit);
}

/** @deprecated use collectPrefixEndNodes */
export function findNode(
  root: TrieNode,
  prefix: string,
  graphemes: readonly string[] = [],
): TrieNode | null {
  const nodes = collectPrefixEndNodes(root, prefix, graphemes);
  return nodes[0] ?? null;
}

export function weightsToSortedLetters(
  weights: Map<string, number>,
  locale = "hu",
): string[] {
  return [...weights.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .map(([ch]) => ch);
}
