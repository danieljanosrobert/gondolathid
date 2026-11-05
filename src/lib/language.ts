export type AppLanguage = "hu" | "ro";

export type LanguageConfig = {
  id: AppLanguage;
  label: string;
  locale: string;
  freqUrl: string;
  hunspellUrl: string;
  wordPattern: RegExp;
  qwertyRows: readonly string[][];
  fallbackGlobalLetters: string[];
  spaceKeyLabel: string;
  spaceKeyAria: string;
  enterKeyAria: string;
  /** Prediktív „befejezés” gyorsgomb szövege (csak ha a szótárban van). */
  finishWord: string;
  /** Egybetűs prefix: „vége” megjelenhet (HU: a, e); pozíció a hossztól függ. */
  singleLetterFinishPrefixes: readonly string[];
  /** Prediktív mód: többbetűs ábécé-egységek (egy gomb = teljes graféma). */
  predictiveDigraphs: readonly string[];
  /** Eszköztár: kettős/tripla gombok kapcsoló felirata. */
  multiCharKeysLabel: string;
  multiCharKeysAria: string;
};

export const LANGUAGES: Record<AppLanguage, LanguageConfig> = {
  hu: {
    id: "hu",
    label: "Magyar",
    locale: "hu",
    freqUrl:
      "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/hu/hu_full.txt",
    hunspellUrl:
      "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/hu_HU/hu_HU.dic",
    wordPattern: /^[a-záéíóöőúüű-]+$/,
    qwertyRows: [
      ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "ő", "ú"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", "é", "á", "ű"],
      ["í", "y", "x", "c", "v", "b", "n", "m", "ö", "ü", "ó"],
    ],
    fallbackGlobalLetters:
      "eatnlsmkoigzréádyhvbőüóíúűöpfcwjqx".split(""),
    spaceKeyLabel: "Szóköz",
    spaceKeyAria: "Szóköz",
    enterKeyAria: "Új sor",
    finishWord: "vége",
    singleLetterFinishPrefixes: ["a", "e"],
    /** Magyar kettős/tripla: cs, dz, dzs, gy, ly, ny, sz, ty, zs */
    predictiveDigraphs: [
      "dzs",
      "cs",
      "dz",
      "gy",
      "ly",
      "ny",
      "sz",
      "ty",
      "zs",
    ],
    multiCharKeysLabel: "sz",
    multiCharKeysAria: "Kettős és hármas betűk a prediktív billentyűzeten",
  },
  ro: {
    id: "ro",
    label: "Română",
    locale: "ro",
    freqUrl:
      "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/ro/ro_full.txt",
    hunspellUrl:
      "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/ro/ro_RO.dic",
    wordPattern: /^[a-zăâîșț-]+$/,
    qwertyRows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "ă", "â"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ș", "î"],
      ["z", "x", "c", "v", "b", "n", "m", "ț"],
    ],
    fallbackGlobalLetters:
      "aeinrtuloscdmpăâîșțfgbvhqyzxwkj".split(""),
    spaceKeyLabel: "Spațiu",
    spaceKeyAria: "Spațiu",
    enterKeyAria: "Linie nouă",
    finishWord: "gata",
    singleLetterFinishPrefixes: [],
    /** Román c/g + e/i (che/chi, ghe/ghi, ce/ci, ge/gi) */
    predictiveDigraphs: [
      "ghe",
      "ghi",
      "che",
      "chi",
      "ce",
      "ci",
      "ge",
      "gi",
    ],
    multiCharKeysLabel: "ge",
    multiCharKeysAria: "Grupuri de 2–3 litere pe tastatura predictivă",
  },
};

/** Public wordlist files (respect Vite `base`, e.g. `/gondolathid/` on GitHub Pages). */
export function dataBasePath(lang: AppLanguage): string {
  return `${import.meta.env.BASE_URL}data/${lang}`;
}

/** @deprecated use LANGUAGES.hu.fallbackGlobalLetters */
export const FALLBACK_GLOBAL_LETTERS = LANGUAGES.hu.fallbackGlobalLetters;

export type KeyboardMode = "predictive" | "qwerty";
