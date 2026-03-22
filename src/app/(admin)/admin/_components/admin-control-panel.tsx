"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { AssetManager } from "./asset-manager";
import { BoardPostManager } from "./board-post-manager";
import { LandingVideoManager } from "./landing-video-manager";
import type { AdminAsset, AdminBoard, AdminLandingVideo } from "./types";

type Panel = "asset" | "board" | "landing-video";

const NAV_ITEMS: { id: Panel; label: string; icon: string; desc: string }[] = [
  { id: "asset", label: "파일 관리", icon: "🗂️", desc: "자산 업로드 및 정리" },
  { id: "board", label: "게시판/게시글 관리", icon: "🧭", desc: "게시판과 게시글 운영" },
  {
    id: "landing-video",
    label: "랜딩 영상 관리",
    icon: "🎬",
    desc: "랜딩 배경 영상 설정",
  },
];

type ToastItem = { id: number; message: string; error: boolean };

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  function push(message: string) {
    if (!message) return;
    const id = ++counter.current;
    const lowered = message.toLowerCase();
    const error =
      message.includes("실패") || message.includes("오류") || lowered.includes("error");
    setToasts((prev) => [...prev, { id, message, error }]);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return { toasts, push, dismiss };
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 3500);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm",
        "animate-[toast-in_0.25s_ease-out]",
        item.error
          ? "border-rose-400/35 bg-rose-950/80 text-rose-100"
          : "border-emerald-400/30 bg-[#0a1a14]/90 text-emerald-100",
      ].join(" ")}
      style={{ minWidth: "260px", maxWidth: "360px" }}
    >
      <span className="mt-0.5 shrink-0 text-base">{item.error ? "⚠" : "✓"}</span>
      <p className="text-sm leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="ml-auto shrink-0 text-xs opacity-50 transition hover:opacity-100"
        aria-label="닫기"
      >
        닫기
      </button>
    </div>
  );
}

type AdminControlPanelProps = {
  initialActiveBoards: AdminBoard[];
  initialInactiveBoards: AdminBoard[];
  initialActiveAssets: AdminAsset[];
  initialTrashedAssets: AdminAsset[];
  initialLandingVideos: AdminLandingVideo[];
};

export function AdminControlPanel({
  initialActiveBoards,
  initialInactiveBoards,
  initialActiveAssets,
  initialTrashedAssets,
  initialLandingVideos,
}: AdminControlPanelProps) {
  const [activePanel, setActivePanel] = useState<Panel>("asset");
  const { toasts, push, dismiss } = useToast();

  async function handleLogout() {
    await signOut({ callbackUrl: "/auth/sign-in" });
  }

  const activeNav = NAV_ITEMS.find((item) => item.id === activePanel);

  return (
    <>
      <div className="flex min-h-screen">
        <aside className="flex w-56 flex-none flex-col border-r border-white/10 bg-black/60">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Admin Console
            </p>
            <p className="mt-1 text-sm font-semibold text-white">운영 대시보드</p>
          </div>

          <nav className="flex-1 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePanel(item.id)}
                  className={[
                    "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors",
                    isActive
                      ? "border-r-2 border-emerald-400 bg-emerald-400/10 text-emerald-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  ].join(" ")}
                >
                  <span className="mt-0.5 text-base">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
            >
              로그아웃
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex h-16 items-center border-b border-white/10 bg-black/30 px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {activeNav?.icon} {activeNav?.label}
            </p>
          </div>

          <main className="flex-1 p-8">
            {activePanel === "asset" && (
              <AssetManager
                initialActiveAssets={initialActiveAssets}
                initialTrashedAssets={initialTrashedAssets}
                onStatus={push}
              />
            )}

            {activePanel === "board" && (
              <BoardPostManager
                initialActiveBoards={initialActiveBoards}
                initialInactiveBoards={initialInactiveBoards}
                onStatus={push}
              />
            )}

            {activePanel === "landing-video" && (
              <LandingVideoManager initialVideos={initialLandingVideos} onStatus={push} />
            )}
          </main>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} item={toast} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
