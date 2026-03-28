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
  variant?: "default" | "hub";
};

type MenuPosition = {
  top: number;
  left: number;
};

type ActionItem = {
  href?: string;
  label: string;
  description: string;
  icon: "admin" | "settings" | "login" | "signup" | "logout";
  tone?: "default" | "danger";
  onClick?: () => void;
};

const MENU_WIDTH = 260;
const VIEWPORT_PADDING = 12;
const MENU_GAP = 10;

function ActionIcon({
  icon,
  tone = "default",
}: {
  icon: ActionItem["icon"];
  tone?: ActionItem["tone"];
}) {
  const className = "h-4 w-4";
  const stroke = tone === "danger" ? "currentColor" : "currentColor";

  if (icon === "admin") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
        <path d="M9.5 12.5l1.6 1.6 3.4-3.6" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V22a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 20.36a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 16 1.7 1.7 0 0 0 3.09 15H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.64 9 1.7 1.7 0 0 0 4.3 7.12l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64 1.7 1.7 0 0 0 10.55 3.09V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 16 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.39.3.61.76.61 1.25" />
      </svg>
    );
  }

  if (icon === "login") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H4" />
      </svg>
    );
  }

  if (icon === "signup") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M15 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <path d="M9 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" transform="translate(3 3)" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function UserAvatar({ name, isHub }: { name: string; isHub: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-[16px] text-sm font-black"
      style={{
        background: isHub
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-accent-soft) 88%, white 12%) 0%, var(--hub-accent-button-bg) 100%)"
          : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, white 82%) 0%, color-mix(in srgb, var(--accent-strong) 28%, white 72%) 100%)",
        color: isHub ? "var(--hub-accent-button-text)" : "var(--strong-text)",
        boxShadow: isHub
          ? "0 12px 24px -18px color-mix(in srgb, var(--hub-accent) 70%, transparent)"
          : "0 12px 24px -20px color-mix(in srgb, var(--accent) 55%, transparent)",
      }}
    >
      {initial}
    </div>
  );
}

function MenuAction({
  item,
  isHub,
  onClose,
}: {
  item: ActionItem;
  isHub: boolean;
  onClose: () => void;
}) {
  const isDanger = item.tone === "danger";
  const className =
    "group box-border flex w-full max-w-full min-w-0 items-center gap-2 rounded-[16px] border px-2.5 py-2 text-left transition duration-200";

  const style = isHub
    ? {
        borderColor: isDanger
          ? "var(--hub-danger-border)"
          : "color-mix(in srgb, var(--hub-border) 88%, transparent)",
        background: isDanger
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-danger-bg) 100%, white 2%) 0%, color-mix(in srgb, var(--hub-surface) 96%, transparent) 100%)"
          : "linear-gradient(135deg, color-mix(in srgb, var(--hub-surface-alt) 98%, white 2%) 0%, color-mix(in srgb, var(--hub-surface) 98%, transparent) 100%)",
        color: isDanger ? "var(--hub-danger-text)" : "var(--hub-text)",
      }
    : {
        borderColor: "color-mix(in srgb, var(--chip-border) 90%, transparent)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--surface) 95%, white 5%) 0%, color-mix(in srgb, var(--surface-elevated) 92%, white 8%) 100%)",
        color: "var(--strong-text)",
      };

  const iconStyle = isHub
    ? {
        borderColor: isDanger
          ? "var(--hub-danger-border)"
          : "color-mix(in srgb, var(--hub-outline) 32%, transparent)",
        backgroundColor: isDanger
          ? "color-mix(in srgb, var(--hub-danger-bg) 100%, white 2%)"
          : "color-mix(in srgb, var(--hub-accent-soft) 72%, transparent)",
      }
    : {
        borderColor: "color-mix(in srgb, var(--chip-border) 92%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--accent) 10%, var(--surface) 90%)",
      };

  const arrowStyle = {
    color: isHub
      ? isDanger
        ? "color-mix(in srgb, var(--hub-danger-text) 74%, transparent)"
        : "color-mix(in srgb, var(--hub-muted) 88%, transparent)"
      : "color-mix(in srgb, var(--text-muted) 85%, transparent)",
  };

  const content = (
    <>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border"
        style={iconStyle}
      >
        <ActionIcon icon={item.icon} tone={item.tone} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-5">{item.label}</span>
      </span>
      <span
        className="shrink-0 transition duration-200 group-hover:translate-x-0.5"
        style={arrowStyle}
      >
        <ChevronIcon />
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className} style={style} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClose();
        item.onClick?.();
      }}
      className={className}
      style={style}
    >
      {content}
    </button>
  );
}

export function ProfileMenu({
  isAuthenticated,
  isAdmin,
  displayName,
  variant = "default",
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isHub = variant === "hub";
  const safeName = displayName || (isAuthenticated ? "\uC0AC\uC6A9\uC790" : "\uAC8C\uC2A4\uD2B8");

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
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
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

  const actions: ActionItem[] = isAuthenticated
    ? [
        ...(isAdmin
          ? [
              {
                href: "/admin",
                label: "\uAD00\uB9AC \uD398\uC774\uC9C0",
                description:
                  "\uC6B4\uC601 \uB3C4\uAD6C\uC640 \uAC8C\uC2DC\uD310 \uAD00\uB9AC \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
                icon: "admin" as const,
              },
            ]
          : []),
        {
          href: "/profile/edit",
          label: "\uD504\uB85C\uD544 \uC124\uC815",
          description:
            "\uB2C9\uB124\uC784\uACFC \uACC4\uC815 \uC815\uBCF4\uB97C \uC218\uC815\uD569\uB2C8\uB2E4.",
          icon: "settings" as const,
        },
        {
          label: "\uB85C\uADF8\uC544\uC6C3",
          description:
            "\uD604\uC7AC \uC138\uC158\uC744 \uC885\uB8CC\uD558\uACE0 \uB77C\uC6B4\uC9C0\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4.",
          icon: "logout" as const,
          tone: "danger",
          onClick: () => void signOut({ callbackUrl: "/lounge" }),
        },
      ]
    : [
        {
          href: "/auth/sign-in",
          label: "\uB85C\uADF8\uC778",
          description:
            "\uB85C\uADF8\uC778 \uD6C4 \uAC8C\uC2DC\uD310\uACFC \uD504\uB85C\uD544 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
          icon: "login" as const,
        },
        {
          href: "/auth/sign-up",
          label: "\uD68C\uC6D0\uAC00\uC785",
          description:
            "\uC0C8 \uACC4\uC815\uC744 \uB9CC\uB4E4\uACE0 \uCEE4\uBBA4\uB2C8\uD2F0 \uD65C\uB3D9\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.",
          icon: "signup" as const,
        },
      ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          isHub
            ? "profile-trigger profile-trigger--hub inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-[0.06em] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 [font-family:var(--font-space-grotesk),sans-serif]"
            : "profile-trigger profile-trigger--default inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
        }
        style={
          isHub
            ? {
                backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 68%, transparent)",
                color: "color-mix(in srgb, var(--hub-text) 88%, var(--hub-muted) 12%)",
              }
            : {
                backgroundColor: "color-mix(in srgb, var(--surface-elevated) 74%, transparent)",
                color: "var(--strong-text)",
              }
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{isAuthenticated ? displayName || "\uD504\uB85C\uD544" : "\uD504\uB85C\uD544"}</span>
        <span
          className="inline-flex text-xs transition duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <ChevronIcon />
        </span>
      </button>

      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed box-border w-[260px] overflow-hidden rounded-[20px] border p-2 shadow-2xl backdrop-blur-2xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 2147483000,
                borderColor: isHub
                  ? "color-mix(in srgb, var(--hub-outline) 26%, var(--hub-border))"
                  : "color-mix(in srgb, var(--chip-border) 95%, transparent)",
                background: isHub
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--hub-surface) 90%, transparent) 0%, color-mix(in srgb, var(--hub-surface-alt) 94%, transparent) 100%)"
                  : "linear-gradient(180deg, color-mix(in srgb, var(--surface) 82%, transparent) 0%, color-mix(in srgb, var(--surface-elevated) 96%, transparent) 100%)",
                boxShadow: isHub
                  ? "0 24px 52px -34px color-mix(in srgb, var(--hub-bg) 82%, black 18%)"
                  : "0 24px 48px -34px rgba(15, 23, 42, 0.28)",
              }}
            >
              <div
                className="rounded-[16px] border p-2.5"
                style={{
                  borderColor: isHub
                    ? "color-mix(in srgb, var(--hub-outline) 28%, transparent)"
                    : "color-mix(in srgb, var(--chip-border) 88%, transparent)",
                  background: isHub
                    ? "linear-gradient(135deg, color-mix(in srgb, var(--hub-accent-soft) 60%, transparent) 0%, color-mix(in srgb, var(--hub-surface-alt) 96%, transparent) 100%)"
                    : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, white 86%) 0%, color-mix(in srgb, var(--surface) 96%, white 4%) 100%)",
                }}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar name={safeName} isHub={isHub} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: isHub ? "var(--hub-muted)" : "var(--text-muted)" }}
                    >
                      {isAuthenticated ? "Account Center" : "Guest Session"}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[13px] font-bold"
                      style={{ color: isHub ? "var(--hub-text)" : "var(--strong-text)" }}
                    >
                      {isAuthenticated ? safeName : "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4"}
                    </p>
                    <p
                      className="mt-1 text-[10px] leading-4"
                      style={{ color: isHub ? "var(--hub-muted)" : "var(--text-muted)" }}
                    >
                      {isAuthenticated
                        ? "\uACC4\uC815 \uC124\uC815\uACFC \uD504\uB85C\uD544 \uBA54\uB274\uB97C \uD55C \uACF3\uC5D0\uC11C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4."
                        : "\uB85C\uADF8\uC778\uD558\uBA74 \uAC8C\uC2DC\uD310 \uD65C\uB3D9\uACFC \uD504\uB85C\uD544 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-2 rounded-[16px] border px-2.5 py-2"
                style={{
                  borderColor: isHub
                    ? "color-mix(in srgb, var(--hub-border) 90%, transparent)"
                    : "color-mix(in srgb, var(--chip-border) 90%, transparent)",
                  background: isHub
                    ? "linear-gradient(180deg, color-mix(in srgb, var(--hub-surface-alt) 94%, transparent) 0%, color-mix(in srgb, var(--hub-surface) 98%, transparent) 100%)"
                    : "linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, white 6%) 0%, var(--surface) 100%)",
                }}
              >
                <ThemeToggleButton variant={variant} />
              </div>

              <div className="mt-2 grid gap-1">
                {actions.map((item) => (
                  <MenuAction key={item.label} item={item} isHub={isHub} onClose={() => setOpen(false)} />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
