/** Szótagolás: leghosszabb illeszkedő graféma előnyben. */
export function graphemesByLengthDesc(
  graphemes: readonly string[],
): string[] {
  return [...graphemes].sort(
    (a, b) => b.length - a.length || a.localeCompare(b),
  );
}

export function segmentWord(
  word: string,
  graphemes: readonly string[],
): string[] {
  const order = graphemesByLengthDesc(graphemes);
  const tokens: string[] = [];
  let i = 0;
  while (i < word.length) {
    let matched = false;
    for (const g of order) {
      if (word.startsWith(g, i)) {
        tokens.push(g);
        i += g.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(word[i]!);
      i += 1;
    }
  }
  return tokens;
}

/** Prefix bejárása grafémánként (a beírt szöveg marad karakter-alapú). */
export function walkPrefixGraphemes(
  prefix: string,
  graphemes: readonly string[],
): string[] {
  const order = graphemesByLengthDesc(graphemes);
  const tokens: string[] = [];
  let i = 0;
  while (i < prefix.length) {
    let matched = false;
    for (const g of order) {
      if (prefix.startsWith(g, i)) {
        tokens.push(g);
        i += g.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(prefix[i]!);
      i += 1;
    }
  }
  return tokens;
}

export function graphemesForFirstLetter(
  firstLetter: string,
  graphemes: readonly string[],
  locale: string,
): string[] {
  return graphemes
    .filter((g) => g.length > 1 && g[0] === firstLetter)
    .sort(
      (a, b) => b.length - a.length || a.localeCompare(b, locale),
    );
}

export function sortedTokensFromWeights(
  weights: Map<string, number>,
  locale: string,
  singleCharOnly: boolean,
): string[] {
  return [...weights.entries()]
    .filter(([token, w]) => w > 0 && (singleCharOnly ? token.length === 1 : token.length > 1))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .map(([token]) => token);
}

/**
 * Szó elején: egybetűk a korpusz sorrendjében (fallbackSingles),
 * csak amelyikre van trie-súly (ha már van adat).
 * Utána a megfelelő grafémák (c → cs).
 */
export function orderWordStartTokens(
  weights: Map<string, number>,
  fallbackSingles: string[],
  configGraphemes: readonly string[],
  locale: string,
  showConfigGraphemesWithoutTrie: boolean,
): string[] {
  const haveTrie = weights.size > 0;
  const showConfig = showConfigGraphemesWithoutTrie || !haveTrie;
  const singles = fallbackSingles.filter(
    (c) => !haveTrie || (weights.get(c) ?? 0) > 0,
  );
  const trieMultis = new Set(sortedTokensFromWeights(weights, locale, false));
  const out: string[] = [];
  const placed = new Set<string>();

  for (const t of singles) {
    out.push(t);
    placed.add(t);

    for (const g of graphemesForFirstLetter(t, configGraphemes, locale)) {
      if (placed.has(g)) continue;
      if (trieMultis.has(g) || showConfig) {
        out.push(g);
        placed.add(g);
      }
    }
  }

  for (const g of trieMultis) {
    if (!placed.has(g)) out.push(g);
  }
  if (configGraphemes.length === 0) {
    return out.filter((t) => t.length === 1);
  }
  return out;
}
