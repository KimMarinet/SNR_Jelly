"use client";

import { useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "snr-theme-mode";

function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  const attrTheme = document.documentElement.getAttribute("data-theme");
  if (attrTheme === "light" || attrTheme === "dark") {
    return attrTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", mode);
  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function ThemeToggleButton() {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);
  const isDark = mode === "dark";

  function handleToggle() {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    setMode(nextMode);
    applyThemeMode(nextMode);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--strong-text)" }}>
          다크 모드
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {isDark ? "ON" : "OFF"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        aria-label="다크 모드 온오프 전환"
        aria-pressed={isDark}
        className="relative inline-flex h-7 w-14 items-center rounded-full border transition"
        style={{
          borderColor: "var(--chip-border)",
          backgroundColor: isDark ? "var(--accent-strong)" : "var(--chip-bg)",
        }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: isDark ? "translateX(30px)" : "translateX(4px)" }}
        />
      </button>
    </div>
  );
}
