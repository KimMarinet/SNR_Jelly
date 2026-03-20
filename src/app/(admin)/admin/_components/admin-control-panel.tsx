"use client";

import { useState } from "react";
import { AssetManager } from "./asset-manager";
import { BoardPostManager } from "./board-post-manager";
import type { AdminAsset, AdminBoard } from "./types";

type Panel = "asset" | "board";

const NAV_ITEMS: { id: Panel; label: string; icon: string; desc: string }[] = [
  { id: "asset", label: "파일 관리", icon: "📁", desc: "에셋 업로드 · 삭제" },
  { id: "board", label: "게시판/게시글 관리", icon: "📋", desc: "게시판 · 게시글 운영" },
];

type AdminControlPanelProps = {
  initialActiveBoards: AdminBoard[];
  initialInactiveBoards: AdminBoard[];
  initialActiveAssets: AdminAsset[];
  initialTrashedAssets: AdminAsset[];
};

export function AdminControlPanel({
  initialActiveBoards,
  initialInactiveBoards,
  initialActiveAssets,
  initialTrashedAssets,
}: AdminControlPanelProps) {
  const [activePanel, setActivePanel] = useState<Panel>("asset");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen">
      {/* ── 좌측 사이드바 ── */}
      <aside className="flex w-56 flex-none flex-col border-r border-white/10 bg-black/60">
        {/* 타이틀 */}
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            Admin Console
          </p>
          <p className="mt-1 text-sm font-semibold text-white">운영 대시보드</p>
        </div>

        {/* 네비게이션 */}
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

        {/* 로그아웃 */}
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

      {/* ── 우측 메인 콘텐츠 ── */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* 패널 헤더 */}
        <div className="border-b border-white/10 bg-black/30 px-8 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {NAV_ITEMS.find((n) => n.id === activePanel)?.icon}{" "}
            {NAV_ITEMS.find((n) => n.id === activePanel)?.label}
          </p>
        </div>

        {/* 패널 본문 */}
        <main className="flex-1 p-8">
          {statusMessage && (
            <p className="mb-4 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              {statusMessage}
            </p>
          )}

          {activePanel === "asset" && (
            <AssetManager
              initialActiveAssets={initialActiveAssets}
              initialTrashedAssets={initialTrashedAssets}
              onStatus={setStatusMessage}
            />
          )}

          {activePanel === "board" && (
            <BoardPostManager
              initialActiveBoards={initialActiveBoards}
              initialInactiveBoards={initialInactiveBoards}
              onStatus={setStatusMessage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
