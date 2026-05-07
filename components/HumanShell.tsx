"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function ShellInner({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    document.body.dataset.theme = theme;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  return (
    <div className="human-shell" data-theme={theme}>
      {children}
    </div>
  );
}

export function HumanShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
