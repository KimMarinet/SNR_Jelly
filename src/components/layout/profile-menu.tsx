"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";

type ProfileMenuProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  displayName?: string | null;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 288;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 8;

export function ProfileMenu({ isAuthenticated, isAdmin, displayName }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === "undefined") {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.right - MENU_WIDTH, VIEWPORT_PADDING),
      window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING,
    );

    setMenuPosition({
      top: rect.bottom + MENU_GAP,
      left,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleViewportChange() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="theme-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:opacity-90"
      >
        <span>{isAuthenticated ? displayName || "프로필" : "프로필"}</span>
        <span className="text-xs">▾</span>
      </button>

      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="theme-panel fixed w-72 rounded-xl border p-3 shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 2147483000,
                boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              }}
            >
              <div className="mb-3 rounded-lg border px-3 py-2" style={{ borderColor: "var(--chip-border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {isAuthenticated ? "현재 사용자" : "게스트"}
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--strong-text)" }}>
                  {isAuthenticated ? displayName || "사용자" : "로그인이 필요합니다"}
                </p>
              </div>

              <div className="mb-3 rounded-lg border px-3 py-2" style={{ borderColor: "var(--chip-border)" }}>
                <ThemeToggleButton />
              </div>

              {isAuthenticated ? (
                <div className="grid gap-2">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="w-full rounded-lg border px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90"
                      style={{ borderColor: "var(--chip-border)", color: "var(--strong-text)" }}
                      onClick={() => setOpen(false)}
                    >
                      관리 페이지로 이동
                    </Link>
                  ) : null}
                  <Link
                    href="/profile/edit"
                    className="w-full rounded-lg border px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90"
                    style={{ borderColor: "var(--chip-border)", color: "var(--strong-text)" }}
                    onClick={() => setOpen(false)}
                  >
                    개인 정보 수정으로 이동
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void signOut({ callbackUrl: "/lounge" });
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-semibold transition hover:opacity-90"
                    style={{ borderColor: "var(--chip-border)", color: "var(--strong-text)" }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/sign-in"
                    className="rounded-lg border px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90"
                    style={{ borderColor: "var(--chip-border)", color: "var(--strong-text)" }}
                    onClick={() => setOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="rounded-lg px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: "var(--accent)", color: "var(--strong-text)" }}
                    onClick={() => setOpen(false)}
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
