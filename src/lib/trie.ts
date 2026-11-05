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

export function insertWord(
  root: TrieNode,
  word: string,
  freq: number,
  countForLetters: boolean,
): void {
  let node = root;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]!;
    if (countForLetters) {
      node.nextWeights.set(ch, (node.nextWeights.get(ch) ?? 0) + freq);
    }
    let child = node.children.get(ch);
    if (!child) {
      child = createTrieNode();
      node.children.set(ch, child);
    }
    node = child;
    upsertSuggestion(node, word, freq);
  }
}

export function buildTrie(entries: WordFreq[]): TrieNode {
  const root = createTrieNode();
  for (const { word, freq } of entries) {
    insertWord(root, word, freq, freq > 0);
  }
  return root;
}

export function findNode(root: TrieNode, prefix: string): TrieNode | null {
  let node: TrieNode = root;
  for (const ch of prefix) {
    const next = node.children.get(ch);
    if (!next) return null;
    node = next;
  }
  return node;
}

export function weightsToSortedLetters(weights: Map<string, number>): string[] {
  return [...weights.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "hu"))
    .map(([ch]) => ch);
}
