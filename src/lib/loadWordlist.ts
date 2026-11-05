import type { AppLanguage } from "../lib/language";
import { dataBasePath } from "../lib/language";
import { extraWordsToFreq, extraWordsUrl, parseExtraWordsText } from "./extraWords";
import type { WordFreq } from "./trie";

export type WordStats = {
  globalLetters: string[];
  bootstrapLines?: number;
};

const BATCH_YIELD = 800;

function parseCorpusLine(line: string): WordFreq | null {
  const tab = line.lastIndexOf("\t");
  if (tab <= 0) return null;
  const word = line.slice(0, tab);
  const freq = Number.parseInt(line.slice(tab + 1), 10);
  if (!word || !Number.isFinite(freq) || freq <= 0) return null;
  return { word, freq };
}

function isGzipBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function bytesToLineStream(
  source: ReadableStream<Uint8Array>,
  onLine: (line: string) => void | Promise<void>,
): Promise<void> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf("\n");
    while (nl >= 0) {
      const line = buffer.slice(0, nl).replace(/\r$/, "");
      buffer = buffer.slice(nl + 1);
      if (line.length > 0) await onLine(line);
      nl = buffer.indexOf("\n");
    }
  }
  const tail = buffer.replace(/\r$/, "");
  if (tail.length > 0) await onLine(tail);
}

async function readTextResponseLines(
  response: Response,
  onLine: (line: string) => void | Promise<void>,
): Promise<void> {
  if (!response.body) throw new Error("Üres válasz");

  const reader = response.body.getReader();
  const first = await reader.read();
  if (first.done || !first.value?.length) return;

  const head = first.value;
  let byteStream: ReadableStream<Uint8Array>;

  if (isGzipBytes(head)) {
    byteStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(head);
      },
      pull(controller) {
        return reader.read().then(({ done, value }) => {
          if (done) controller.close();
          else if (value) controller.enqueue(value);
        });
      },
      cancel() {
        void reader.cancel();
      },
    }).pipeThrough(new DecompressionStream("gzip"));
  } else {
    byteStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(head);
      },
      pull(controller) {
        return reader.read().then(({ done, value }) => {
          if (done) controller.close();
          else if (value) controller.enqueue(value);
        });
      },
      cancel() {
        void reader.cancel();
      },
    });
  }

  await bytesToLineStream(byteStream, onLine);
}

export async function fetchWordStats(
  lang: AppLanguage,
): Promise<WordStats> {
  const url = `${dataBasePath(lang)}/stats.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${lang} stats.json hiányzik (${res.status}) — futtasd: npm run build:words`);
  }
  return (await res.json()) as WordStats;
}

export type LoadProgress = {
  phase: "bootstrap" | "supplement" | "done";
  loaded: number;
  totalEstimate: number;
};

export async function streamBootstrap(
  lang: AppLanguage,
  onBatch: (batch: WordFreq[]) => Promise<void>,
  onProgress: (p: LoadProgress) => void,
): Promise<number> {
  const url = `${dataBasePath(lang)}/bootstrap.tsv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${lang} bootstrap.tsv hiányzik (${res.status})`);

  let loaded = 0;
  let batch: WordFreq[] = [];
  const totalEstimate = 60_000;

  await readTextResponseLines(res, async (line) => {
    const row = parseCorpusLine(line);
    if (!row) return;
    batch.push(row);
    loaded++;
    if (batch.length >= BATCH_YIELD) {
      await onBatch(batch);
      batch = [];
      onProgress({ phase: "bootstrap", loaded, totalEstimate });
      await yieldToMain();
    }
  });

  if (batch.length > 0) await onBatch(batch);
  onProgress({ phase: "bootstrap", loaded, totalEstimate });
  return loaded;
}

export async function loadSupplement(lang: AppLanguage): Promise<WordFreq[]> {
  const url = `${dataBasePath(lang)}/supplement.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${lang} supplement.txt hiányzik (${res.status})`);
  const text = await res.text();
  const entries: WordFreq[] = [];
  for (const line of text.split(/\n/)) {
    const word = line.trim();
    if (word) entries.push({ word, freq: 0 });
  }
  return entries;
}

/** Shared personal / domain words (all languages). */
export async function loadExtraWords(): Promise<WordFreq[]> {
  const url = extraWordsUrl();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`extra-words.txt hiányzik (${res.status})`);
  }
  const text = await res.text();
  return extraWordsToFreq(parseExtraWordsText(text));
}
