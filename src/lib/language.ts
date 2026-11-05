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
  },
};

/** Public wordlist files (respect Vite `base`, e.g. `/gondolathid/` on GitHub Pages). */
export function dataBasePath(lang: AppLanguage): string {
  return `${import.meta.env.BASE_URL}data/${lang}`;
}

/** @deprecated use LANGUAGES.hu.fallbackGlobalLetters */
export const FALLBACK_GLOBAL_LETTERS = LANGUAGES.hu.fallbackGlobalLetters;

export type KeyboardMode = "predictive" | "qwerty";
