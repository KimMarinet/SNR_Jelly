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
  const [heroVideoIds, { noticePosts, strategyPosts, livePosts }] =
    await Promise.all([getHeroVideoIds(), getBriefingData()]);

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

        <div className="relative z-20 px-6 md:px-16 lg:px-24">
          <div className="mx-auto grid min-h-screen w-full max-w-[1600px] items-center lg:grid-cols-2">

            {/* 좌측: 메인 텍스트 */}
            <div className="flex min-h-screen items-center lg:justify-center lg:px-8">
              <div className="w-full max-w-xl">
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
              title="Neon Live"
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
      <SlashTransition to="/lounge" />
    </main>
  );
}
