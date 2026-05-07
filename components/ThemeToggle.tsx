"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();
  return (
    <button className="theme-toggle" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
