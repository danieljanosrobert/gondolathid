import { useMemo } from "react";
import type { AppLanguage, KeyboardMode } from "../lib/language";
import { LANGUAGES } from "../lib/language";
import styles from "./Keyboard.module.css";

const PREDICTIVE_COLS = 8;
/** Internal slot marker for the finish key in predictive rows. */
const FINISH_SLOT = "\u0000";
/** Invisible pad so „vége” can sit at the 10th slot when fewer letter keys exist. */
const EMPTY_SLOT = "\u0001";

type Props = {
  lang: AppLanguage;
  onLangChange: (lang: AppLanguage) => void;
  mode: KeyboardMode;
  onModeChange: (mode: KeyboardMode) => void;
  qwertyRows: readonly string[][];
  predictiveLetters: string[];
  allowedLetters: ReadonlySet<string>;
  finishKey: string | null;
  finishKeyInsertAt: number;
  onFinishKey: () => void;
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

function mergeFinishIntoLetterGrid(
  letters: string[],
  finishKey: string | null,
  insertAt: number,
): string[] {
  if (!finishKey) return letters;
  if (insertAt <= 0) {
    return [FINISH_SLOT, ...letters];
  }
  const head = letters.slice(0, insertAt);
  const tail = letters.slice(insertAt);
  while (head.length < insertAt) {
    head.push(EMPTY_SLOT);
  }
  return [...head, FINISH_SLOT, ...tail];
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
  finishKey,
  finishKeyInsertAt,
  onFinishKey,
  onLetter,
  onBackspace,
  onSpace,
  onEnter,
}: Props) {
  const isPredictive = mode === "predictive";
  const lastQwertyRow = qwertyRows.length - 1;
  const copy = LANGUAGES[lang];

  const predictiveRows = useMemo(() => {
    const flat = mergeFinishIntoLetterGrid(
      predictiveLetters,
      finishKey,
      finishKey ? finishKeyInsertAt : 0,
    );
    return chunkLetters(flat, PREDICTIVE_COLS);
  }, [predictiveLetters, finishKey, finishKeyInsertAt]);

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
                {row.map((cell, cellIndex) =>
                  cell === FINISH_SLOT && finishKey ? (
                    <button
                      key="finish"
                      type="button"
                      className={`${styles.key} ${styles.keyFinish}`}
                      onClick={onFinishKey}
                    >
                      {finishKey}
                    </button>
                  ) : cell === EMPTY_SLOT ? (
                    <span
                      key={`pad-${rowIndex}-${cellIndex}`}
                      className={styles.keySpacer}
                      aria-hidden
                    />
                  ) : (
                    <button
                      key={`${rowIndex}-${cellIndex}-${cell}`}
                      type="button"
                      className={styles.key}
                      onClick={() => onLetter(cell)}
                    >
                      {cell}
                    </button>
                  ),
                )}
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
