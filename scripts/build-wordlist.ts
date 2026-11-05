import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_LEN = 2;
const MAX_LEN = 24;
const MIN_EXPORT_FREQ = 2;
const BOOTSTRAP_LINES = 60_000;

type LangBuild = {
  id: string;
  freqUrl: string;
  hunspellUrl: string;
  wordPattern: RegExp;
  locale: string;
  finishWord: string;
};

const LANGS: LangBuild[] = [
  {
    id: "hu",
    freqUrl:
      "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/hu/hu_full.txt",
    hunspellUrl:
      "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/hu_HU/hu_HU.dic",
    wordPattern: /^[a-záéíóöőúüű-]+$/,
    locale: "hu",
    finishWord: "vége",
  },
  {
    id: "ro",
    freqUrl:
      "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/ro/ro_full.txt",
    hunspellUrl:
      "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/ro/ro_RO.dic",
    wordPattern: /^[a-zăâîșț-]+$/,
    locale: "ro",
    finishWord: "gata",
  },
];

function normalize(raw: string, pattern: RegExp, locale: string): string | null {
  let word = raw.split("/")[0]!.trim().toLowerCase();
  if (locale === "ro") {
    word = word.replace(/ş/g, "ș").replace(/ţ/g, "ț");
  }
  if (word.length < MIN_LEN || word.length > MAX_LEN) return null;
  if (!pattern.test(word)) return null;
  if (word.startsWith("-") || word.endsWith("-")) return null;
  return word;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  return res.text();
}

function parseFrequencyList(
  text: string,
  pattern: RegExp,
  locale: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const space = trimmed.lastIndexOf(" ");
    if (space <= 0) continue;
    const word = normalize(trimmed.slice(0, space), pattern, locale);
    const freq = Number.parseInt(trimmed.slice(space + 1), 10);
    if (!word || !Number.isFinite(freq) || freq <= 0) continue;
    map.set(word, (map.get(word) ?? 0) + freq);
  }
  return map;
}

function parseHunspell(text: string, pattern: RegExp, locale: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const word = normalize(lines[i]?.trim() ?? "", pattern, locale);
    if (word) out.push(word);
  }
  return out;
}

function globalLettersFromMap(
  byWord: Map<string, number>,
  locale: string,
): string[] {
  const counts = new Map<string, number>();
  for (const [word, freq] of byWord) {
    if (freq < MIN_EXPORT_FREQ) continue;
    for (const ch of word) {
      counts.set(ch, (counts.get(ch) ?? 0) + freq);
    }
  }
  return [...counts.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale))
    .map(([ch]) => ch);
}

function loadSharedExtraWords(publicRoot: string): string[] {
  const path = join(publicRoot, "extra-words.txt");
  if (!existsSync(path)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const raw = line.trim();
    if (!raw) continue;
    const word = raw.toLocaleLowerCase("hu");
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

async function buildLanguage(lang: LangBuild, publicRoot: string) {
  console.log(`\n=== ${lang.id.toUpperCase()} ===`);
  console.log(`Downloading ${lang.id}_full…`);
  const byWord = parseFrequencyList(
    await fetchText(lang.freqUrl),
    lang.wordPattern,
    lang.locale,
  );
  console.log(`Corpus forms: ${byWord.size}`);

  const corpusLines: string[] = [];
  for (const [word, freq] of byWord) {
    if (freq >= MIN_EXPORT_FREQ) corpusLines.push(`${word}\t${freq}`);
  }
  corpusLines.sort((a, b) => {
    const fa = Number.parseInt(a.split("\t")[1]!, 10);
    const fb = Number.parseInt(b.split("\t")[1]!, 10);
    return fb - fa || a.localeCompare(b, lang.locale);
  });

  const globalLetters = globalLettersFromMap(byWord, lang.locale);
  console.log(`Global letters: ${globalLetters.slice(0, 16).join("")}…`);

  const bootstrapLines = corpusLines.slice(0, BOOTSTRAP_LINES);
  console.log(`Bootstrap: ${bootstrapLines.length} lines`);

  console.log("Hunspell supplement…");
  const hunspell = parseHunspell(
    await fetchText(lang.hunspellUrl),
    lang.wordPattern,
    lang.locale,
  );
  const supplementLines: string[] = [];
  for (const word of hunspell) {
    if (!byWord.has(word)) supplementLines.push(word);
  }
  if (!byWord.has(lang.finishWord) && !supplementLines.includes(lang.finishWord)) {
    supplementLines.push(lang.finishWord);
  }
  const extraWords = loadSharedExtraWords(publicRoot);
  for (const word of extraWords) {
    if (!supplementLines.includes(word)) supplementLines.push(word);
  }
  supplementLines.sort((a, b) => a.localeCompare(b, lang.locale));

  const outDir = join(publicRoot, lang.id);
  mkdirSync(outDir, { recursive: true });

  writeFileSync(
    join(outDir, "stats.json"),
    JSON.stringify({ globalLetters, bootstrapLines: bootstrapLines.length }),
  );
  await pipeline(
    Readable.from([bootstrapLines.join("\n") + "\n"]),
    createWriteStream(join(outDir, "bootstrap.tsv")),
  );
  await pipeline(
    Readable.from([supplementLines.join("\n") + "\n"]),
    createWriteStream(join(outDir, "supplement.txt")),
  );
  console.log(`Wrote public/data/${lang.id}/ (${supplementLines.length} supplement words)`);
}

async function main() {
  const root = dirname(fileURLToPath(import.meta.url));
  const publicRoot = join(root, "..", "public", "data");
  mkdirSync(publicRoot, { recursive: true });
  for (const lang of LANGS) {
    await buildLanguage(lang, publicRoot);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
