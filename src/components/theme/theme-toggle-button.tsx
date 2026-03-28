"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";
type ThemeToggleButtonProps = {
  variant?: "default" | "hub";
  layout?: "default" | "compact";
};

const STORAGE_KEY = "snr-theme-mode";
const THEME_CHANGE_EVENT = "snr-theme-change";

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
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

function SunIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggleButton({
  variant = "default",
  layout = "default",
}: ThemeToggleButtonProps) {
  const mode = useSyncExternalStore(subscribe, readThemeMode, () => "dark");
  const isHub = variant === "hub";
  const isDark = mode === "dark";

  function handleToggle() {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    applyThemeMode(nextMode);
  }

  if (layout === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        aria-pressed={isDark}
        title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5"
        style={{
          borderColor: isHub
            ? "color-mix(in srgb, var(--hub-outline) 34%, transparent)"
            : "color-mix(in srgb, var(--chip-border) 92%, transparent)",
          background: isHub
            ? isDark
              ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-accent-soft) 75%, transparent) 0%, color-mix(in srgb, var(--hub-surface-alt) 98%, transparent) 100%)"
              : "linear-gradient(135deg, color-mix(in srgb, var(--hub-surface-alt) 92%, transparent) 0%, color-mix(in srgb, var(--hub-surface) 98%, transparent) 100%)"
            : isDark
              ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, white 80%) 0%, color-mix(in srgb, var(--accent-strong) 34%, white 66%) 100%)"
              : "linear-gradient(135deg, color-mix(in srgb, var(--surface) 96%, white 4%) 0%, color-mix(in srgb, var(--surface-elevated) 92%, white 8%) 100%)",
          color: isHub
            ? isDark
              ? "var(--hub-accent-button-text)"
              : "var(--hub-text)"
            : isDark
              ? "#ffffff"
              : "var(--foreground)",
          boxShadow: isHub
            ? "0 12px 28px -20px color-mix(in srgb, var(--hub-bg) 70%, transparent)"
            : "0 12px 24px -20px rgba(15, 23, 42, 0.28)",
        }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p
          className="text-sm font-semibold leading-5"
          style={{ color: isHub ? "var(--hub-text)" : "var(--strong-text)" }}
        >
          {"\uB2E4\uD06C \uBAA8\uB4DC"}
        </p>
        <p
          className="mt-0.5 text-[11px] leading-4"
          style={{ color: isHub ? "var(--hub-muted)" : "var(--text-muted)" }}
        >
          {isDark
            ? "\uC5B4\uB450\uC6B4 \uD14C\uB9C8\uAC00 \uC801\uC6A9 \uC911\uC785\uB2C8\uB2E4."
            : "\uBC1D\uC740 \uD14C\uB9C8\uAC00 \uC801\uC6A9 \uC911\uC785\uB2C8\uB2E4."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        aria-label="\uB2E4\uD06C \uBAA8\uB4DC \uC804\uD658"
        aria-pressed={isDark}
        className="relative inline-flex h-9 w-[68px] items-center rounded-full border p-1 transition duration-200"
        style={{
          borderColor: isHub
            ? "color-mix(in srgb, var(--hub-outline) 34%, transparent)"
            : "color-mix(in srgb, var(--chip-border) 92%, transparent)",
          background: isDark
            ? isHub
              ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-accent-soft) 75%, transparent) 0%, color-mix(in srgb, var(--hub-surface-alt) 98%, transparent) 100%)"
              : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, white 80%) 0%, color-mix(in srgb, var(--accent-strong) 34%, white 66%) 100%)"
            : isHub
              ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-surface-alt) 92%, transparent) 0%, color-mix(in srgb, var(--hub-surface) 98%, transparent) 100%)"
              : "linear-gradient(135deg, color-mix(in srgb, var(--surface) 96%, white 4%) 0%, color-mix(in srgb, var(--surface-elevated) 92%, white 8%) 100%)",
        }}
      >
        <span
          className="absolute left-2.5 text-[10px] font-semibold"
          style={{
            color: isDark
              ? isHub
                ? "var(--hub-accent)"
                : "var(--accent-strong)"
              : isHub
                ? "var(--hub-muted)"
                : "var(--text-muted)",
            opacity: isDark ? 1 : 0.55,
          }}
        >
          ON
        </span>
        <span
          className="absolute right-2.5 text-[10px] font-semibold"
          style={{
            color: isDark
              ? isHub
                ? "var(--hub-muted)"
                : "var(--text-muted)"
              : isHub
                ? "var(--hub-text)"
                : "var(--strong-text)",
            opacity: isDark ? 0.55 : 1,
          }}
        >
          OFF
        </span>
        <span
          className="pointer-events-none inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-transform duration-200"
          style={{
            transform: isDark ? "translateX(28px)" : "translateX(0)",
            background: isHub
              ? isDark
                ? "var(--hub-accent-button-bg)"
                : "color-mix(in srgb, var(--hub-surface) 96%, white 4%)"
              : isDark
                ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)"
                : "#ffffff",
            color: isHub
              ? isDark
                ? "var(--hub-accent-button-text)"
                : "var(--hub-text)"
              : isDark
                ? "#ffffff"
                : "var(--foreground)",
            boxShadow: isHub
              ? "0 8px 20px -14px color-mix(in srgb, var(--hub-bg) 70%, transparent)"
              : "0 8px 20px -14px rgba(15, 23, 42, 0.28)",
          }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </span>
      </button>
    </div>
  );
}
