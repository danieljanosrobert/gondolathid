import { useMemo } from "react";
import type { AppLanguage, KeyboardMode } from "../lib/language";
import { LANGUAGES } from "../lib/language";
import styles from "./Keyboard.module.css";

const PREDICTIVE_COLS = 10;

type Props = {
  lang: AppLanguage;
  onLangChange: (lang: AppLanguage) => void;
  mode: KeyboardMode;
  onModeChange: (mode: KeyboardMode) => void;
  qwertyRows: readonly string[][];
  predictiveLetters: string[];
  allowedLetters: ReadonlySet<string>;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
};

function BackspaceKey({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.keyBackspace}
      onClick={onClick}
      aria-label="Törlés"
    >
      ⌫
    </button>
  );
}

function chunkLetters(letters: string[], cols: number): string[][] {
  if (letters.length === 0) return [[]];
  const rows: string[][] = [];
  for (let i = 0; i < letters.length; i += cols) {
    rows.push(letters.slice(i, i + cols));
  }
  return rows;
}

export function Keyboard({
  lang,
  onLangChange,
  mode,
  onModeChange,
  qwertyRows,
  predictiveLetters,
  allowedLetters,
  onLetter,
  onBackspace,
  onSpace,
  onEnter,
}: Props) {
  const isPredictive = mode === "predictive";
  const lastQwertyRow = qwertyRows.length - 1;
  const copy = LANGUAGES[lang];

  const predictiveRows = useMemo(
    () => chunkLetters(predictiveLetters, PREDICTIVE_COLS),
    [predictiveLetters],
  );

  return (
    <section className={styles.keyboard} aria-label="Billentyűzet">
      <div className={styles.toolbar}>
        <div className={styles.segmentGroup} role="group" aria-label="Nyelv">
          {(Object.keys(LANGUAGES) as AppLanguage[]).map((id) => (
            <button
              key={id}
              type="button"
              className={
                lang === id ? styles.segmentBtnActive : styles.segmentBtn
              }
              aria-pressed={lang === id}
              onClick={() => onLangChange(id)}
            >
              {LANGUAGES[id].label}
            </button>
          ))}
        </div>
        <div className={styles.segmentGroup} role="group" aria-label="Kiosztás">
          <button
            type="button"
            className={
              !isPredictive ? styles.segmentBtnActive : styles.segmentBtn
            }
            aria-pressed={!isPredictive}
            onClick={() => onModeChange("qwerty")}
          >
            QWERTY
          </button>
          <button
            type="button"
            className={isPredictive ? styles.segmentBtnActive : styles.segmentBtn}
            aria-pressed={isPredictive}
            onClick={() => onModeChange("predictive")}
          >
            Prediktív
          </button>
        </div>
      </div>

      {isPredictive ? (
        <div className={styles.keysPanel}>
          <div className={styles.predictiveBlock}>
            {predictiveRows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  {row.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      className={styles.key}
                      onClick={() => onLetter(letter)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className={styles.keysPanel}>
          <div className={styles.qwertyBlock}>
            {qwertyRows.map((row, i) => (
              <div
                key={i}
                className={i === lastQwertyRow ? styles.rowLast : styles.row}
              >
                {row.map((letter) => {
                  const enabled = allowedLetters.has(letter);
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={
                        enabled
                          ? styles.key
                          : `${styles.key} ${styles.keyDisabled}`
                      }
                      disabled={!enabled}
                      aria-disabled={!enabled}
                      onClick={() => onLetter(letter)}
                    >
                      {letter}
                    </button>
                  );
                })}
                {i === lastQwertyRow ? (
                  <BackspaceKey onClick={onBackspace} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.bottomRow}>
        {isPredictive ? (
          <>
            <button
              type="button"
              className={styles.actionSpace}
              onClick={onSpace}
              aria-label={copy.spaceKeyAria}
            >
              {copy.spaceKeyLabel}
            </button>
            <BackspaceKey onClick={onBackspace} />
            <button
              type="button"
              className={styles.actionEnter}
              onClick={onEnter}
              aria-label={copy.enterKeyAria}
            >
              ↵
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.actionSpace}
              onClick={onSpace}
              aria-label={copy.spaceKeyAria}
            >
              {copy.spaceKeyLabel}
            </button>
            <button
              type="button"
              className={styles.actionEnter}
              onClick={onEnter}
              aria-label={copy.enterKeyAria}
            >
              ↵
            </button>
          </>
        )}
      </div>
    </section>
  );
}
