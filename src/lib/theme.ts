export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "gondolathid-theme";

export function readStoredTheme(): ColorScheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function getInitialTheme(): ColorScheme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export function applyTheme(scheme: ColorScheme): void {
  document.documentElement.setAttribute("data-theme", scheme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", scheme === "light" ? "#f2f2f7" : "#1a1a2e");
  }
}

export function persistTheme(scheme: ColorScheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    /* ignore */
  }
}
