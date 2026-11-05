import { useEffect, useState } from "react";
import type { AppLanguage } from "../lib/language";
import { LANGUAGES } from "../lib/language";
import {
  fetchWordStats,
  loadExtraWords,
  loadSupplement,
  streamBootstrap,
  type LoadProgress,
} from "../lib/loadWordlist";
import {
  appendToEngine,
  createEmptyEngine,
  type DictionaryEngine,
} from "../lib/predict";

export type DictionaryState =
  | { status: "error"; message: string }
  | {
      status: "ready";
      engine: DictionaryEngine;
      loadProgress: number;
      wordCount: number;
    };

export function useDictionary(lang: AppLanguage): DictionaryState {
  const langConfig = LANGUAGES[lang];

  const [state, setState] = useState<DictionaryState>(() => ({
    status: "ready",
    engine: createEmptyEngine(
      langConfig.fallbackGlobalLetters,
      langConfig.predictiveDigraphs,
      langConfig.locale,
    ),
    loadProgress: 0,
    wordCount: 0,
  }));

  useEffect(() => {
    const { fallbackGlobalLetters, predictiveDigraphs, locale, finishWord } =
      LANGUAGES[lang];
    let cancelled = false;
    let engine = createEmptyEngine(
      fallbackGlobalLetters,
      predictiveDigraphs,
      locale,
    );
    let wordCount = 0;

    const bump = (loadProgress: number) => {
      if (cancelled) return;
      setState({
        status: "ready",
        engine,
        loadProgress,
        wordCount,
      });
    };

    engine = createEmptyEngine(
      fallbackGlobalLetters,
      predictiveDigraphs,
      locale,
    );
    bump(0);

    (async () => {
      try {
        const stats = await fetchWordStats(lang);
        if (cancelled) return;
        engine = createEmptyEngine(
          stats.globalLetters,
          predictiveDigraphs,
          locale,
        );
        appendToEngine(engine, [{ word: finishWord, freq: 0 }]);

        const extra = await loadExtraWords();
        if (cancelled) return;
        appendToEngine(engine, extra);
        wordCount += extra.length + 1;
        bump(0.05);

        const totalEstimate = stats.bootstrapLines ?? 60_000;

        await streamBootstrap(
          lang,
          async (batch) => {
            appendToEngine(engine, batch);
            wordCount += batch.length;
          },
          (p: LoadProgress) => {
            const ratio =
              p.phase === "bootstrap"
                ? Math.min(0.92, 0.05 + (0.87 * p.loaded) / Math.max(totalEstimate, 1))
                : 0.92;
            bump(ratio);
          },
        );

        if (cancelled) return;
        bump(0.93);

        const supplement = await loadSupplement(lang);
        if (cancelled) return;
        appendToEngine(engine, supplement);
        wordCount += supplement.length;
        bump(1);
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Ismeretlen hiba",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return state;
}
