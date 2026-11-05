import type { ColorScheme } from "../lib/theme";
import styles from "./ThemeToggle.module.css";

type Props = {
  scheme: ColorScheme;
  onToggle: () => void;
};

function IconMoon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function ThemeToggle({ scheme, onToggle }: Props) {
  const isLight = scheme === "light";
  const label = isLight
    ? "Sötét mód bekapcsolása"
    : "Világos mód bekapcsolása";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {isLight ? <IconSun /> : <IconMoon />}
    </button>
  );
}
