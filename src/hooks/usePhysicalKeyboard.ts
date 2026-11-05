import { useEffect } from "react";

type Handlers = {
  allowedLetters: ReadonlySet<string>;
  onLetter: (letter: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onEnter: () => void;
};

export function usePhysicalKeyboard({
  allowedLetters,
  onLetter,
  onSpace,
  onBackspace,
  onEnter,
}: Handlers): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        onSpace();
        return;
      }
      if (e.key.length !== 1) return;

      const letter = e.key.toLowerCase();
      if (!allowedLetters.has(letter)) return;

      e.preventDefault();
      onLetter(letter);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowedLetters, onLetter, onSpace, onBackspace, onEnter]);
}
