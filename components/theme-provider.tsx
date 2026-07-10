"use client";

import { useEffect } from "react";
import { resolveTheme, useUIStore } from "@/lib/store";

/**
 * Applies the resolved theme (light/dark) to <html> by toggling the `.dark`
 * class, and keeps it in sync with the OS when the user chooses "system".
 * Rendered once at the app root.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    apply();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return <>{children}</>;
}
