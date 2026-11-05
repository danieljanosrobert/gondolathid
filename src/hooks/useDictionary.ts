import { useEffect, useState } from "react";
import type { AppLanguage } from "../lib/language";
import { LANGUAGES } from "../lib/language";
import {
  fetchWordStats,
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
  const [state, setState] = useState<DictionaryState>(() => ({
    status: "ready",
    engine: createEmptyEngine(LANGUAGES[lang].fallbackGlobalLetters),
    loadProgress: 0,
    wordCount: 0,
  }));

  useEffect(() => {
    const fallback = LANGUAGES[lang].fallbackGlobalLetters;
    let cancelled = false;
    let engine = createEmptyEngine(fallback);
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

    engine = createEmptyEngine(fallback);
    bump(0);

    (async () => {
      try {
        const stats = await fetchWordStats(lang);
        if (cancelled) return;
        engine = createEmptyEngine(stats.globalLetters);
        bump(0.02);

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
                ? Math.min(0.92, p.loaded / Math.max(totalEstimate, 1))
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
