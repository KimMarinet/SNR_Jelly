"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { signOut } from "next-auth/react";
import { CharacterManager } from "./character-manager";
import { BoardPostManager } from "./board-post-manager";
import { readJson } from "./http";
import { LandingVideoManager } from "./landing-video-manager";
import type { AdminBoard, AdminCharacter, AdminLandingVideo } from "./types";

type Panel = "character" | "board" | "landing-video";

type ToastItem = { id: number; message: string; error: boolean };

const NAV_ITEMS: { id: Panel; label: string; icon: string; desc: string }[] = [
  { id: "character", label: "캐릭터 관리", icon: "CH", desc: "캐릭터 정보를 등록하고 능력치와 초월 데이터를 관리합니다." },
  { id: "board", label: "게시판 운영", icon: "BD", desc: "게시판 상태와 게시글 흐름을 한 화면에서 관리하는 구역입니다." },
  { id: "landing-video", label: "랜딩 영상 관리", icon: "VD", desc: "메인 랜딩에 노출되는 배경 영상의 순서와 공개 여부를 제어합니다." },
];

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  function push(message: string) {
    if (!message) return;
    const id = ++counter.current;
    const lowered = message.toLowerCase();
    const error = lowered.includes("실패") || lowered.includes("오류") || lowered.includes("error") || lowered.includes("invalid");
    setToasts((prev) => [...prev, { id, message, error }]);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return { toasts, push, dismiss };
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 3500);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className="admin-toast flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm animate-[toast-in_0.25s_ease-out]" data-error={item.error} style={{ minWidth: "260px", maxWidth: "360px" }}>
      <span className="mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={item.error ? { backgroundColor: "var(--hub-danger-bg)", color: "var(--hub-danger-text)" } : { backgroundColor: "var(--hub-accent-soft)", color: "var(--hub-accent)" }}>{item.error ? "ERR" : "OK"}</span>
      <p className="text-sm leading-snug">{item.message}</p>
      <button type="button" onClick={() => onDismiss(item.id)} className="ml-auto shrink-0 text-xs opacity-60 transition hover:opacity-100" aria-label="닫기">닫기</button>
    </div>
  );
}

function DashboardStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <article className={["admin-stat-card rounded-2xl p-2.5", accent ? "admin-stat-card--accent" : ""].join(" ")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: accent ? "var(--hub-accent)" : "color-mix(in srgb, var(--hub-muted) 82%, transparent)" }}>{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight [font-family:var(--font-space-grotesk),sans-serif] md:text-[1.35rem]" style={{ color: accent ? "var(--hub-text)" : "color-mix(in srgb, var(--hub-text) 82%, transparent)" }}>{value}</p>
    </article>
  );
}

type AdminControlPanelProps = {
  initialActiveBoards: AdminBoard[];
  initialInactiveBoards: AdminBoard[];
  initialCharacters: AdminCharacter[];
  initialLandingVideos: AdminLandingVideo[];
  initialHeroBackgroundUrl: string | null;
};

export function AdminControlPanel({ initialActiveBoards, initialInactiveBoards, initialCharacters, initialLandingVideos, initialHeroBackgroundUrl }: AdminControlPanelProps) {
  const [activePanel, setActivePanel] = useState<Panel>("character");
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState(initialHeroBackgroundUrl);
  const [heroBackgroundUploading, setHeroBackgroundUploading] = useState(false);
  const { toasts, push, dismiss } = useToast();
  const heroBackgroundInputRef = useRef<HTMLInputElement>(null);

  async function handleLogout() {
    await signOut({ callbackUrl: "/auth/sign-in" });
  }

  function openHeroBackgroundPicker() {
    heroBackgroundInputRef.current?.click();
  }

  async function handleHeroBackgroundUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setHeroBackgroundUploading(true);
    push("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/preferences/hero-background", { method: "POST", body: formData });
      const data = await readJson<{ backgroundImageUrl: string | null; message?: string }>(response);
      setHeroBackgroundUrl(data.backgroundImageUrl ?? null);
      push(data.message ?? "개인 브리핑 배경 이미지를 저장했습니다.");
    } catch (caught) {
      push(caught instanceof Error ? caught.message : "개인 브리핑 배경 이미지를 저장하지 못했습니다.");
    } finally {
      setHeroBackgroundUploading(false);
    }
  }

  async function handleHeroBackgroundRemove() {
    setHeroBackgroundUploading(true);
    push("");
    try {
      const response = await fetch("/api/admin/preferences/hero-background", { method: "DELETE" });
      const data = await readJson<{ backgroundImageUrl: string | null; message?: string }>(response);
      setHeroBackgroundUrl(data.backgroundImageUrl ?? null);
      push(data.message ?? "개인 브리핑 배경 이미지를 제거했습니다.");
    } catch (caught) {
      push(caught instanceof Error ? caught.message : "개인 브리핑 배경 이미지를 제거하지 못했습니다.");
    } finally {
      setHeroBackgroundUploading(false);
    }
  }

  const activeNav = NAV_ITEMS.find((item) => item.id === activePanel);
  const activeBoardCount = initialActiveBoards.length;
  const inactiveBoardCount = initialInactiveBoards.length;
  const activeVideoCount = initialLandingVideos.filter((video) => video.isActive).length;
  const totalCharacters = initialCharacters.length;

  return (
    <>
      <div className="admin-shell">
        <header className={["admin-hero admin-hero--compact admin-hero--embedded", heroBackgroundUrl ? "admin-hero--with-background" : ""].join(" ")}>
          {heroBackgroundUrl ? <><div className="admin-hero-background" style={{ backgroundImage: `url("${heroBackgroundUrl}")` }} aria-hidden /><div className="admin-hero-background-overlay" aria-hidden /></> : null}
          <div className="admin-hero-body">
            <div className="admin-hero-bar">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ borderColor: "var(--hub-outline)", backgroundColor: "var(--hub-accent-soft)", color: "var(--hub-accent)" }}>운영 브리핑</span>
                <div className="mt-3"><h1 className="text-2xl font-black uppercase leading-none tracking-tight md:text-4xl [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: "var(--hub-text)" }}>Admin <span className="text-transparent" style={{ WebkitTextStroke: "1px var(--hub-accent)" }}>Console</span></h1><p className="mt-2 max-w-2xl text-xs leading-relaxed md:text-sm" style={{ color: "var(--hub-muted)" }}>캐릭터, 게시판, 랜딩 영상을 한 콘솔에서 관리할 수 있도록 운영 구역을 재정비했습니다.</p></div>
              </div>
              <div className="admin-hero-links">
                <input ref={heroBackgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleHeroBackgroundUpload} />
                {heroBackgroundUrl ? (
                  <button type="button" onClick={handleHeroBackgroundRemove} className="admin-link-chip admin-link-chip--compact" disabled={heroBackgroundUploading}>{heroBackgroundUploading ? "제거 중..." : "배경 제거"}</button>
                ) : (
                  <button type="button" onClick={openHeroBackgroundPicker} className="admin-link-chip admin-link-chip--compact" disabled={heroBackgroundUploading}>{heroBackgroundUploading ? "배경 저장 중" : "개인 배경 설정"}</button>
                )}
                <Link href="/lounge" className="admin-link-chip admin-link-chip--compact">라운지 보기</Link>
                <Link href="/" className="admin-link-chip admin-link-chip--compact">랜딩 미리보기</Link>
              </div>
            </div>
            <div className="admin-hero-stats"><DashboardStat label="게시판 수" value={`${activeBoardCount + inactiveBoardCount}`} /><DashboardStat label="캐릭터 수" value={`${totalCharacters}`} /><DashboardStat label="랜딩 영상" value={`${activeVideoCount}`} /><DashboardStat label="현재 작업" value={activeNav?.label ?? "--"} accent /></div>
          </div>
        </header>
        <div className="admin-dashboard admin-dashboard--merged">
          <aside className="admin-panel admin-sidebar"><div className="border-b pb-4" style={{ borderColor: "var(--hub-border)" }}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: "var(--hub-accent)" }}>관리자 메뉴</p><p className="mt-2 text-lg font-bold" style={{ color: "var(--hub-text)" }}>작업 선택</p><p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>필요한 메뉴만 선택해 운영 항목을 빠르게 갱신할 수 있습니다.</p></div><nav className="space-y-2">{NAV_ITEMS.map((item) => { const isActive = activePanel === item.id; return <button key={item.id} type="button" onClick={() => setActivePanel(item.id)} className="admin-nav-button" data-active={isActive}><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-black tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ borderColor: isActive ? "color-mix(in srgb, var(--hub-border) 92%, transparent)" : "var(--hub-border)", backgroundColor: isActive ? "color-mix(in srgb, var(--hub-surface-alt) 28%, transparent)" : "transparent", color: isActive ? "var(--hub-text)" : "var(--hub-muted)" }}>{item.icon}</span><div className="min-w-0"><p className="text-sm font-semibold leading-tight">{item.label}</p><p className="mt-1 text-xs leading-relaxed opacity-80">{item.desc}</p></div></button>; })}</nav><div className="mt-auto space-y-4 border-t pt-4" style={{ borderColor: "var(--hub-border)" }}><div className="admin-stat-card rounded-2xl p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: "var(--hub-muted)" }}>선택된 메뉴</p><p className="mt-2 text-sm font-semibold" style={{ color: "var(--hub-text)" }}>{activeNav?.label}</p><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--hub-muted)" }}>{activeNav?.desc}</p></div><button type="button" onClick={handleLogout} className="admin-link-chip w-full justify-center">로그아웃</button></div></aside>
          <section className="admin-panel admin-workspace"><div className="admin-toolbar"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: "var(--hub-accent)" }}>현재 작업 영역</p><h2 className="mt-2 text-2xl font-black tracking-tight [font-family:var(--font-space-grotesk),sans-serif]" style={{ color: "var(--hub-text)" }}>{activeNav?.label}</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>{activeNav?.desc}</p></div><div className="flex flex-wrap gap-2"><span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--hub-outline)", backgroundColor: "var(--hub-accent-soft)", color: "var(--hub-accent)" }}>게시판 {activeBoardCount + inactiveBoardCount}</span><span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}>캐릭터 {totalCharacters}</span><span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}>영상 {initialLandingVideos.length}</span></div></div><main className="admin-content">{activePanel === "character" && <CharacterManager initialCharacters={initialCharacters} onStatus={push} />}{activePanel === "board" && <BoardPostManager initialActiveBoards={initialActiveBoards} initialInactiveBoards={initialInactiveBoards} onStatus={push} />}{activePanel === "landing-video" && <LandingVideoManager initialVideos={initialLandingVideos} onStatus={push} />}</main></section>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2" aria-live="polite">{toasts.map((toast) => <Toast key={toast.id} item={toast} onDismiss={dismiss} />)}</div>
    </>
  );
}
