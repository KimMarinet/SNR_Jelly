import type React from "react";
import Link from "next/link";
import { HeroVideoBackground } from "@/components/landing/hero-video-background";
import { prisma } from "@/lib/prisma";
import { SlashTransition } from "@/components/slash-transition";

export const dynamic = "force-dynamic";

// ─── 데이터 ───────────────────────────────────────────────────────────────────

async function getHeroVideoIds(): Promise<string[]> {
  try {
    const videos = await prisma.landingVideo.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { youtubeId: true },
    });
    return videos.map((v) => v.youtubeId).filter(Boolean);
  } catch {
    return [];
  }
}

const postSelect = {
  id: true,
  title: true,
  viewCount: true,
  createdAt: true,
  board: { select: { slug: true, title: true } },
} as const;

type BriefingPost = {
  id: number;
  title: string;
  viewCount: number;
  createdAt: Date;
  board: { slug: string; title: string };
};

type ActiveBoard = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  _count: { posts: number };
};

function formatDate(date: Date): string {
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  const days = Math.floor(diffHours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

async function getBriefingData() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [noticePosts, strategyPosts, livePosts] = await Promise.all([
      prisma.post.findMany({
        where: { isPinned: true, isPublished: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: postSelect,
      }),
      prisma.post.findMany({
        where: { isPublished: true, deletedAt: null, isPinned: false, createdAt: { gte: sevenDaysAgo } },
        orderBy: { viewCount: "desc" },
        take: 3,
        select: postSelect,
      }),
      prisma.post.findMany({
        where: { isPublished: true, deletedAt: null, createdAt: { gte: fortyEightHoursAgo } },
        orderBy: { viewCount: "desc" },
        take: 3,
        select: postSelect,
      }),
    ]);

    return { noticePosts, strategyPosts, livePosts };
  } catch {
    return { noticePosts: [], strategyPosts: [], livePosts: [] };
  }
}

async function getActiveBoards(): Promise<ActiveBoard[]> {
  try {
    return await prisma.board.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        _count: { select: { posts: { where: { isPublished: true, deletedAt: null } } } },
      },
    });
  } catch {
    return [];
  }
}

// ─── 게시판 아이콘 매핑 ────────────────────────────────────────────────────────

function BoardIcon({ slug }: { slug: string }) {
  const s = slug.toLowerCase();
  if (s.includes("notice") || s.includes("공지") || s.includes("announce")) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    );
  }
  if (s.includes("strategy") || s.includes("공략") || s.includes("guide")) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    );
  }
  if (s.includes("free") || s.includes("자유") || s.includes("chat") || s.includes("lounge")) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    );
  }
  if (s.includes("recruit") || s.includes("모집") || s.includes("party")) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    );
  }
  // 기본 아이콘
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

// ─── 브리핑 카드 ──────────────────────────────────────────────────────────────

function BriefingCard({
  tagLabel, tagClassName, title, bgIcon,
  firstItemBorderColor, posts, emptyMessage, footerLabel, isLive = false,
}: {
  tagLabel: string; tagClassName: string; title: string; bgIcon: string;
  firstItemBorderColor: string; posts: BriefingPost[];
  emptyMessage: string; footerLabel: string; isLive?: boolean;
}) {
  return (
    <div className="group relative flex h-[450px] flex-col overflow-hidden border-l-2 border-transparent bg-[#131315] p-8 transition-all duration-300 hover:border-[#CCFF00] hover:bg-[#1f1f22]">
      <div
        className="pointer-events-none absolute right-4 top-4 select-none text-8xl opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.12]"
        aria-hidden
      >
        {bgIcon}
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <span className={`mb-5 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tagClassName}`}>
          {isLive && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-400 align-middle" />}
          {tagLabel}
        </span>

        <h3 className="mb-5 text-4xl font-black uppercase leading-tight tracking-tight text-white [font-family:var(--font-space-grotesk),sans-serif]">
          {title}
        </h3>

        <div className="flex-1">
          {posts.length === 0 ? (
            <p className="text-sm italic text-[#767577]">{emptyMessage}</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post, idx) => (
                <li
                  key={post.id}
                  className="py-1 pl-3"
                  style={{
                    borderLeft: `2px solid ${idx === 0 ? firstItemBorderColor : "#48474a"}`,
                    opacity: idx === 0 ? 1 : 0.6,
                  }}
                >
                  <Link href={`/board/${post.board.slug}/${post.id}`} className="group/item flex flex-col gap-0.5">
                    <span className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover/item:text-[#CCFF00]">
                      {post.title}
                    </span>
                    <span className="text-[11px] text-[#767577]">
                      {post.board.title} · {formatDate(post.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-[10px] uppercase tracking-[0.05em] text-[#767577] [font-family:var(--font-space-grotesk),sans-serif]">
            {footerLabel}
          </span>
          <Link
            href="/lounge"
            className="text-xl font-bold text-[#CCFF00] transition-transform duration-200 group-hover:translate-x-2"
            aria-label="더 보기"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 섹션 헤더 공용 ───────────────────────────────────────────────────────────

function SectionHeader({ label, title, meta }: { label: string; title: string; meta?: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
          {label}
        </p>
        <h2 className="text-2xl font-bold uppercase tracking-tight text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
          {title}
        </h2>
      </div>
      <div className="h-[1px] flex-grow bg-gradient-to-r from-[rgba(204,255,0,0.3)] to-transparent" />
      {meta && (
        <span className="text-[10px] uppercase tracking-widest text-[#767577] opacity-60 [font-family:var(--font-space-grotesk),sans-serif]">
          {meta}
        </span>
      )}
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function PreLandingPage() {
  const [heroVideoIds, { noticePosts, strategyPosts, livePosts }, boards] =
    await Promise.all([getHeroVideoIds(), getBriefingData(), getActiveBoards()]);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <main
      className="select-none overflow-x-hidden bg-[#0e0e10] [&_img]:pointer-events-none"
      style={{ WebkitUserDrag: "none" } as React.CSSProperties}
    >
      {/* ══════════════════════════════════════════════════
          히어로 섹션 — 영상 배경 + 타이틀
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        <HeroVideoBackground videoIds={heroVideoIds} />

        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0e0e10]/80 via-[#0e0e10]/50 to-[#0e0e10]" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0e0e10]/70 via-transparent to-[#0e0e10]/40" />
        <div className="scanline absolute inset-0 z-10" />

        <div className="relative z-20 flex min-h-screen w-full items-center px-6 md:px-16 lg:px-24">
          <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-12">

            {/* 좌측: 메인 텍스트 */}
            <div className="flex flex-col justify-center lg:w-[58%]">
              <div className="hero-badge mb-7 inline-flex w-fit items-center gap-2 rounded-[2px] border border-[rgba(204,255,0,0.20)] bg-[rgba(204,255,0,0.06)] px-3 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#CCFF00] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#CCFF00]" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
                  System Online · 세븐나이츠 리버스
                </span>
              </div>

              <h1 className="hero-title mb-7 text-6xl font-black leading-tight tracking-tight text-white md:text-8xl [font-family:var(--font-space-grotesk),sans-serif]">
                정보가 곧
                <br />
                <span className="text-[#CCFF00]">전력이다</span>
              </h1>

              <p className="hero-sub mb-10 max-w-lg text-base leading-[1.8] tracking-wide text-[#adaaad] md:text-lg">
                세븐나이츠 리버스의 공략, 메타, 커뮤니티를<br className="hidden md:block" />
                하나의 라운지에서 빠르게 확인하세요.
              </p>

              <div className="hero-cta flex flex-wrap items-center gap-4">
                <Link
                  href="/lounge"
                  className="group relative inline-flex items-center gap-2.5 rounded-[2px] bg-[linear-gradient(135deg,#f3ffca_0%,#cafd00_100%)] px-10 py-4 text-lg font-black uppercase tracking-wide text-[#516700] shadow-[0_0_30px_rgba(204,255,0,0.20)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(204,255,0,0.35)] active:scale-95 [font-family:var(--font-space-grotesk),sans-serif]"
                >
                  <span className="relative z-10">라운지 입장</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="relative z-10 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/lounge"
                  className="inline-flex items-center gap-2 rounded-[2px] border border-white/20 px-10 py-4 text-lg font-black uppercase tracking-wide text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(204,255,0,0.40)] hover:text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]"
                >
                  공략 둘러보기
                </Link>
              </div>
            </div>

            {/* 우측: 상태 패널 (데스크탑 전용) */}
            <div className="hidden py-20 lg:flex lg:w-[38%] lg:flex-col lg:justify-between lg:gap-4">
              <div className="border-l-4 border-[#CCFF00] p-6" style={{ background: "rgba(44,44,47,0.6)", backdropFilter: "blur(24px)" }}>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.08em] text-[#adaaad] [font-family:var(--font-space-grotesk),sans-serif]">Protocol_Status</span>
                <div className="text-2xl font-bold tracking-tight text-white [font-family:var(--font-space-grotesk),sans-serif]">100% OPERATIONAL</div>
              </div>
              <div className="border-l-4 border-[#CCFF00]/50 p-8" style={{ background: "rgba(44,44,47,0.6)", backdropFilter: "blur(24px)" }}>
                <span className="mb-3 block text-[10px] uppercase tracking-[0.08em] text-[#adaaad] [font-family:var(--font-space-grotesk),sans-serif]">Daily_Briefing</span>
                <div className="mb-1 text-4xl font-black italic tracking-tight text-white [font-family:var(--font-space-grotesk),sans-serif]">LIVE ↑</div>
                <p className="text-xs tracking-wide text-[#767577]">공지 · 공략 · 라이브 피드 업데이트 중</p>
              </div>
              <div className="border-l-4 border-[#48474a] p-6" style={{ background: "rgba(44,44,47,0.6)", backdropFilter: "blur(24px)" }}>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.08em] text-[#adaaad] [font-family:var(--font-space-grotesk),sans-serif]">Community</span>
                <div className="text-2xl font-bold tracking-tight text-white [font-family:var(--font-space-grotesk),sans-serif]">LOUNGE OPEN</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          브리핑 섹션 — 공지 · 공략 · 라이브
      ══════════════════════════════════════════════════ */}
      <section className="px-6 py-24 md:px-16 lg:px-24" style={{ background: "#0e0e10", borderTop: "1px solid rgba(72,71,74,0.3)" }}>
        <div className="mx-auto max-w-[1440px]">
          <SectionHeader
            label="Terminal / Mission_Parameters"
            title="Daily Briefing"
            meta="SECURE_LEVEL_01"
          />
          <div className="grid grid-cols-1 gap-[1px] bg-[rgba(72,71,74,0.2)] lg:grid-cols-3">
            <BriefingCard
              tagLabel="Priority_Alpha"
              tagClassName="bg-rose-500/10 text-rose-400"
              title="Notice"
              bgIcon="⚠"
              firstItemBorderColor="rgba(248,113,113,0.6)"
              posts={noticePosts}
              emptyMessage="현재 고정 공지가 없습니다."
              footerLabel={`PUBLISHED: ${timeLabel} HRS`}
            />
            <BriefingCard
              tagLabel="Strategic_Data"
              tagClassName="bg-[rgba(204,255,0,0.10)] text-[#CCFF00]"
              title="Strategy"
              bgIcon="◈"
              firstItemBorderColor="rgba(204,255,0,0.5)"
              posts={strategyPosts}
              emptyMessage="이번 주 공략 게시글이 없습니다."
              footerLabel={`REVISION: V.${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`}
            />
            <BriefingCard
              tagLabel="Live Feed"
              tagClassName="text-white"
              title="Neon_Live"
              bgIcon="▶"
              firstItemBorderColor="rgba(204,255,0,0.5)"
              posts={livePosts}
              emptyMessage="최근 48시간 내 게시글이 없습니다."
              footerLabel="ACTIVE"
              isLive
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          게시판 허브 — Board Hub
      ══════════════════════════════════════════════════ */}
      <section className="px-6 py-24 md:px-16 lg:px-24" style={{ background: "#131315", borderTop: "1px solid rgba(72,71,74,0.3)" }}>
        <div className="mx-auto max-w-[1440px]">

          {/* 헤더 */}
          <header className="mb-16 flex flex-col justify-between gap-6 border-b border-[rgba(72,71,74,0.2)] pb-12 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#CCFF00] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#CCFF00]" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
                  Terminal / Communication_Nodes
                </span>
              </div>
              <h2 className="mb-4 text-5xl font-black uppercase leading-[0.9] tracking-tighter text-white md:text-7xl [font-family:var(--font-space-grotesk),sans-serif]">
                Board{" "}
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: "1px #CCFF00" }}
                >
                  Hub
                </span>
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-[#adaaad]">
                전술 데이터, 커뮤니티, 공략 정보를 한 곳에서 탐색하세요. 원하는 게시판을 선택해 바로 진입합니다.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#767577] opacity-60 [font-family:var(--font-space-grotesk),sans-serif]">
                Total Boards
              </span>
              <span className="text-3xl font-bold text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
                {boards.length}
                <span className="ml-1 text-xs font-normal opacity-50">ACTIVE</span>
              </span>
              <div className="mt-3 flex gap-1.5">
                <div className="h-1 w-12 bg-[#CCFF00]" />
                <div className="h-1 w-8 bg-[#262528]" />
                <div className="h-1 w-4 bg-[#262528]" />
              </div>
            </div>
          </header>

          {/* 게시판 카드 그리드 */}
          {boards.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-[#767577]">
              <p className="text-sm uppercase tracking-widest [font-family:var(--font-space-grotesk),sans-serif]">
                No boards available
              </p>
            </div>
          ) : (
            <>
              <SectionHeader label="Communication_Nodes" title="Boards" meta="TERMINAL_ACCESS" />
              <div className="grid grid-cols-1 gap-[1px] bg-[rgba(72,71,74,0.15)] md:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.slug}`}
                    className="group relative border-l-2 border-transparent bg-[#131315] p-8 transition-all duration-200 hover:border-[#CCFF00] hover:bg-[#1f1f22]"
                  >
                    {/* 아이콘 + 게시글 수 */}
                    <div className="mb-6 flex items-start justify-between">
                      <span className="text-[#CCFF00]/50 transition-colors duration-200 group-hover:text-[#CCFF00]">
                        <BoardIcon slug={board.slug} />
                      </span>
                      <span className="rounded-[2px] bg-[#262528] px-2 py-1 text-[10px] uppercase tracking-wide text-[#adaaad] [font-family:var(--font-space-grotesk),sans-serif]">
                        {board._count.posts.toLocaleString()} POSTS
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="mb-2 text-xl font-bold uppercase tracking-tight text-white transition-colors duration-200 group-hover:text-[#CCFF00] [font-family:var(--font-space-grotesk),sans-serif]">
                      {board.title}
                    </h3>

                    {/* 설명 */}
                    <p className="mb-8 text-sm leading-relaxed text-[#767577]">
                      {board.description ?? "게시판 설명이 준비 중입니다."}
                    </p>

                    {/* hover 시 ENTER TERMINAL */}
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#CCFF00] opacity-0 transition-opacity duration-200 group-hover:opacity-100 [font-family:var(--font-space-grotesk),sans-serif]">
                      ENTER TERMINAL
                      <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* 하단 라운지 이동 CTA */}
          <div className="mt-16 flex justify-center">
            <Link
              href="/lounge"
              className="inline-flex items-center gap-3 border border-[rgba(204,255,0,0.25)] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#CCFF00] transition-all duration-300 hover:bg-[rgba(204,255,0,0.06)] hover:border-[rgba(204,255,0,0.5)] [font-family:var(--font-space-grotesk),sans-serif]"
            >
              전체 라운지 둘러보기
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <SlashTransition to="/lounge" />
    </main>
  );
}
