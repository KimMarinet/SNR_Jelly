"use client";

import { useEffect } from "react";

const STORAGE_KEY = "snr-theme-mode";

type ThemeMode = "light" | "dark";

function resolveThemeMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

export function ThemeInitializer() {
  useEffect(() => {
    const mode = resolveThemeMode();
    document.documentElement.setAttribute("data-theme", mode);
  }, []);

  return null;
}
