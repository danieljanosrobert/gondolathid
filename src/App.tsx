import { useCallback, useMemo, useState } from "react";
import { Keyboard } from "./components/Keyboard";
import { WordBar } from "./components/WordBar";
import { useDictionary } from "./hooks/useDictionary";
import { usePhysicalKeyboard } from "./hooks/usePhysicalKeyboard";
import type { AppLanguage } from "./lib/language";
import { LANGUAGES } from "./lib/language";
import type { KeyboardMode } from "./lib/language";
import "./styles/global.css";

export default function App() {
  const [lang, setLang] = useState<AppLanguage>("hu");
  const dict = useDictionary(lang);
  const [mode, setMode] = useState<KeyboardMode>("predictive");
  const [composedText, setComposedText] = useState("");
  const [prefix, setPrefix] = useState("");

  const langConfig = LANGUAGES[lang];
  const engine = dict.status === "ready" ? dict.engine : null;
  const loadProgress = dict.status === "ready" ? dict.loadProgress : 0;

  const suggestions = useMemo(
    () => engine?.suggestWords(prefix) ?? [],
    [engine, prefix],
  );

  const predictiveLetters = useMemo(() => {
    if (!engine) return langConfig.fallbackGlobalLetters;
    const letters = engine.nextLetters(prefix);
    if (letters.length > 0) return letters;
    return engine.globalLetterFreq;
  }, [engine, prefix, langConfig.fallbackGlobalLetters]);

  const allowedLetters = useMemo(
    () => new Set(predictiveLetters),
    [predictiveLetters],
  );

  const loadHint =
    dict.status === "ready" && loadProgress < 1
      ? `Szótár betöltése… ${Math.round(loadProgress * 100)}%`
      : undefined;

  const onLangChange = useCallback((next: AppLanguage) => {
    setLang(next);
    setPrefix("");
  }, []);

  const onLetter = useCallback((letter: string) => {
    setPrefix((p) => p + letter);
  }, []);

  const onPickWord = useCallback((word: string) => {
    setComposedText((t) => t + word + " ");
    setPrefix("");
  }, []);

  const onBackspace = useCallback(() => {
    setPrefix((p) => {
      if (p.length > 0) return p.slice(0, -1);
      setComposedText((t) => t.slice(0, -1));
      return "";
    });
  }, []);

  const onSpace = useCallback(() => {
    if (prefix) {
      setComposedText((t) => t + prefix + " ");
      setPrefix("");
    } else {
      setComposedText((t) => t + " ");
    }
  }, [prefix]);

  const onEnter = useCallback(() => {
    if (prefix) {
      setComposedText((t) => t + prefix + "\n");
      setPrefix("");
    } else {
      setComposedText((t) => t + "\n");
    }
  }, [prefix]);

  usePhysicalKeyboard({
    allowedLetters,
    onLetter,
    onSpace,
    onBackspace,
    onEnter,
  });

  if (dict.status === "error") {
    return (
      <div className="app app--center">
        <p>{dict.message}</p>
        <p className="hint">
          Futtasd: <code>npm run build:words</code>
        </p>
      </div>
    );
  }

  return (
    <div className="app" lang={langConfig.locale}>
      <WordBar
        composedText={composedText}
        prefix={prefix}
        suggestions={suggestions}
        onPickWord={onPickWord}
        loadHint={loadHint}
        placeholder={
          lang === "ro" ? "Începe să scrii…" : "Kezdj el betűzni…"
        }
      />
      <div className="keyboardDock">
        <Keyboard
          lang={lang}
          onLangChange={onLangChange}
          mode={mode}
          onModeChange={setMode}
          qwertyRows={langConfig.qwertyRows}
          predictiveLetters={predictiveLetters}
          allowedLetters={allowedLetters}
          onLetter={onLetter}
          onBackspace={onBackspace}
          onSpace={onSpace}
          onEnter={onEnter}
        />
      </div>
    </div>
  );
}
