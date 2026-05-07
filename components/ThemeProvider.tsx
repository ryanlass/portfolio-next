"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "portfolio-theme";

function persistTheme(next: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const themeRef = useRef<Theme>("light");
  themeRef.current = theme;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setThemeState(stored);
    } catch {}
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    if (themeRef.current === next) return;
    themeRef.current = next;
    // Mutate the DOM directly so the visual change paints in the same frame
    // as the click — avoids React reconciliation blocking the first paint.
    document.querySelectorAll<HTMLElement>(".human-shell, .agent-doc").forEach((el) => {
      el.dataset.theme = next;
    });
    document.body.dataset.theme = next;
    persistTheme(next);
    // Defer non-visual side-effects (canvas re-renders, React state sync)
    // so the browser paints first.
    window.setTimeout(() => {
      setThemeState(next);
      window.dispatchEvent(new Event("portfolio-theme-change"));
    }, 0);
  }, []);

  const setTheme = useCallback((next: Theme) => applyTheme(next), [applyTheme]);
  const toggleTheme = useCallback(
    () => applyTheme(themeRef.current === "dark" ? "light" : "dark"),
    [applyTheme],
  );

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
