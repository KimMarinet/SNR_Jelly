import type React from "react";
import Link from "next/link";
import { HeroVideoBackground } from "@/components/landing/hero-video-background";
import { prisma } from "@/lib/prisma";
import { SlashTransition } from "@/components/slash-transition";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "⚔️", label: "최신 공략", desc: "실전 빌드와 전투 가이드" },
  { icon: "📊", label: "메타 분석", desc: "패치별 강약점 요약" },
  { icon: "🛡️", label: "길드/파티", desc: "함께할 동료와 전략 공유" },
  { icon: "💬", label: "커뮤니티", desc: "자유롭게 의견을 나누는 라운지" },
];

async function getHeroVideoIds(): Promise<string[]> {
  try {
    const videos = await prisma.landingVideo.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { youtubeId: true },
    });

    return videos.map((video) => video.youtubeId).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function PreLandingPage() {
  const heroVideoIds = await getHeroVideoIds();

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 select-none [&_img]:pointer-events-none"
      style={{ WebkitUserDrag: "none" } as React.CSSProperties}
    >
      <HeroVideoBackground videoIds={heroVideoIds} />

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/75 via-slate-950/50 to-slate-950" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/40" />
      <div className="scanline absolute inset-0 z-10" />

      <section className="relative z-20 flex min-h-screen flex-col items-start justify-center px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              세븐나이츠 리버스 공략 & 커뮤니티
            </span>
          </div>

          <h1 className="brand-heading hero-title text-5xl leading-[1.1] text-white md:text-7xl lg:text-8xl">
            정보가 곧
            <br />
            <span className="gradient-text">전력이다</span>
          </h1>

          <p className="hero-sub mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            세븐나이츠 리버스의 공략, 메타, 커뮤니티를 하나의 라운지에서 빠르게 확인하세요.
          </p>

          <div className="hero-cta mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/lounge"
              className="cta-primary group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-3.5 text-sm font-bold text-slate-950 transition-all duration-300"
            >
              <span className="relative z-10">라운지 입장하기</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/lounge"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/50 hover:text-amber-300"
            >
              공략 둘러보기
            </Link>
          </div>
        </div>

        <div className="hero-features mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.label}
              className="feature-card group flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"
            >
              <span className="text-2xl">{feature.icon}</span>
              <span className="text-sm font-bold text-white">{feature.label}</span>
              <span className="text-xs leading-snug text-slate-400 group-hover:text-slate-300">
                {feature.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      <SlashTransition to="/lounge" />
    </main>
  );
}
