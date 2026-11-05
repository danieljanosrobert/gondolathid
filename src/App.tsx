import { useCallback, useMemo, useState } from "react";
import { Keyboard } from "./components/Keyboard";
import { WordBar } from "./components/WordBar";
import { useDictionary } from "./hooks/useDictionary";
import { usePhysicalKeyboard } from "./hooks/usePhysicalKeyboard";
import {
  buildSuggestions,
  finishKeyInsertIndex,
  predictiveLettersForPrefix,
  shouldShowFinishKey,
} from "./lib/predict";
import type { AppLanguage } from "./lib/language";
import { LANGUAGES } from "./lib/language";
import type { KeyboardMode } from "./lib/language";
import {
  applyTheme,
  getInitialTheme,
  persistTheme,
  type ColorScheme,
} from "./lib/theme";
import "./styles/global.css";

export default function App() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getInitialTheme);
  const [lang, setLang] = useState<AppLanguage>("hu");
  const dict = useDictionary(lang);
  const [mode, setMode] = useState<KeyboardMode>("predictive");
  const [multiCharKeys, setMultiCharKeys] = useState(true);
  const [composedText, setComposedText] = useState("");
  const [prefix, setPrefix] = useState("");

  const langConfig = LANGUAGES[lang];
  const engine = dict.status === "ready" ? dict.engine : null;
  const loadProgress = dict.status === "ready" ? dict.loadProgress : 0;
  const dictionaryReady = dict.status === "ready" && loadProgress >= 1;

  const activeGraphemes = useMemo(
    () => (multiCharKeys ? langConfig.predictiveDigraphs : []),
    [multiCharKeys, langConfig.predictiveDigraphs],
  );

  const suggestions = useMemo(() => {
    if (!engine || !dictionaryReady) return [];
    return buildSuggestions(
      engine,
      prefix,
      langConfig.finishWord,
      activeGraphemes,
    );
  }, [engine, prefix, langConfig.finishWord, dictionaryReady, activeGraphemes]);

  const finishKey = useMemo(() => {
    if (!engine || !dictionaryReady || mode !== "predictive") return null;
    if (
      !shouldShowFinishKey(
        engine,
        prefix,
        langConfig.finishWord,
        langConfig.singleLetterFinishPrefixes,
        activeGraphemes,
      )
    ) {
      return null;
    }
    return langConfig.finishWord;
  }, [
    engine,
    dictionaryReady,
    prefix,
    langConfig.finishWord,
    langConfig.singleLetterFinishPrefixes,
    mode,
    activeGraphemes,
  ]);

  const predictiveLetters = useMemo(() => {
    if (!engine || !dictionaryReady) return [];
    return predictiveLettersForPrefix(
      engine,
      prefix,
      langConfig.finishWord,
      langConfig.fallbackGlobalLetters,
      langConfig.singleLetterFinishPrefixes,
      false,
      activeGraphemes,
    );
  }, [
    engine,
    dictionaryReady,
    prefix,
    langConfig.finishWord,
    langConfig.fallbackGlobalLetters,
    langConfig.singleLetterFinishPrefixes,
    activeGraphemes,
  ]);

  const finishKeyInsertAt = useMemo(() => {
    if (!finishKey) return 0;
    return finishKeyInsertIndex(prefix, predictiveLetters.length);
  }, [finishKey, prefix, predictiveLetters.length]);

  const onPickWord = useCallback((word: string) => {
    setComposedText((t) => t + word + " ");
    setPrefix("");
  }, []);

  const onFinishKey = useCallback(() => {
    if (!prefix) return;
    setComposedText((t) => t + prefix + " ");
    setPrefix("");
  }, [prefix]);

  const allowedLetters = useMemo(() => {
    const set = new Set<string>();
    for (const token of predictiveLetters) {
      for (const ch of token) set.add(ch);
    }
    return set;
  }, [predictiveLetters]);

  const onLangChange = useCallback((next: AppLanguage) => {
    setLang(next);
    setPrefix("");
  }, []);

  const onColorSchemeToggle = useCallback(() => {
    setColorScheme((prev) => {
      const next: ColorScheme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      persistTheme(next);
      return next;
    });
  }, []);

  const onLetter = useCallback((letter: string) => {
    setPrefix((p) => p + letter);
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
    allowedLetters: dictionaryReady ? allowedLetters : new Set(),
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

  const loadingLabel =
    lang === "ro"
      ? `Se încarcă dicționarul… ${Math.round(loadProgress * 100)}%`
      : `Szótár betöltése… ${Math.round(loadProgress * 100)}%`;

  return (
    <div className="app" lang={langConfig.locale}>
      <WordBar
        composedText={composedText}
        prefix={prefix}
        suggestions={suggestions}
        onPickWord={onPickWord}
        colorScheme={colorScheme}
        onColorSchemeToggle={onColorSchemeToggle}
        placeholder={
          dictionaryReady
            ? lang === "ro"
              ? "Începe să scrii…"
              : "Kezdj el betűzni…"
            : lang === "ro"
              ? "Dicționarul se încarcă…"
              : "Szótár betöltése…"
        }
      />
      <div className="keyboardDock">
        {dictionaryReady ? (
          <Keyboard
            lang={lang}
            onLangChange={onLangChange}
            mode={mode}
            onModeChange={setMode}
            multiCharKeys={multiCharKeys}
            onMultiCharKeysChange={setMultiCharKeys}
            qwertyRows={langConfig.qwertyRows}
            predictiveLetters={predictiveLetters}
            allowedLetters={allowedLetters}
            onLetter={onLetter}
            onBackspace={onBackspace}
            onSpace={onSpace}
            onEnter={onEnter}
            finishKey={finishKey}
            finishKeyInsertAt={finishKeyInsertAt}
            onFinishKey={onFinishKey}
          />
        ) : (
          <div
            className="keyboardLoading"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="keyboardLoadingSpinner" aria-hidden />
            <p className="keyboardLoadingText">{loadingLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
