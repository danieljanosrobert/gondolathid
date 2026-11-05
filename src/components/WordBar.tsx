import styles from "./WordBar.module.css";

type Props = {
  composedText: string;
  prefix: string;
  suggestions: string[];
  onPickWord: (word: string) => void;
  loadHint?: string;
  placeholder?: string;
};

export function WordBar({
  composedText,
  prefix,
  suggestions,
  onPickWord,
  loadHint,
  placeholder = "Kezdj el betűzni…",
}: Props) {
  const draft = composedText + prefix;

  return (
    <header className={styles.bar}>
      <div
        className={styles.textArea}
        aria-live="polite"
        aria-readonly="true"
        role="document"
      >
        {draft || (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        {loadHint ? (
          <span className={styles.loadHint}>{loadHint}</span>
        ) : null}
      </div>
      <div className={styles.suggestions} role="list">
        {suggestions.map((word) => (
          <button
            key={word}
            type="button"
            className={styles.chip}
            role="listitem"
            onClick={() => onPickWord(word)}
          >
            {word}
          </button>
        ))}
      </div>
    </header>
  );
}
