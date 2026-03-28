import Link from "next/link";

/**
 * 히어로 배경 영상 목록
 * - 배열 순서대로 재생되며, 마지막 영상 후 처음으로 반복됩니다.
 * - 영상 추가/제거: YouTube 영상 ID(youtu.be/ 뒤 11자리)만 배열에 넣으면 됩니다.
 *
 * 예시) "https://youtu.be/ABC123XYZ01" → "ABC123XYZ01"
 */
const HERO_VIDEO_IDS: string[] = [
  "y3qV8f8NH8E", // Seven Knights Rebirth – 게임플레이 쇼케이스 (더미)
  "H7SbfZ_TZvw", // Seven Knights Rebirth – Dev Notes (더미)
  // 실제 영상 ID를 아래에 추가하세요
];

const FEATURES = [
  { icon: "⚔️", label: "최신 공략", desc: "실전 전투·덱 빌딩 가이드" },
  { icon: "🛡️", label: "메타 분석", desc: "시즌별 강캐·약캐 정리" },
  { icon: "👥", label: "길드·파티", desc: "같이 할 동료를 찾아보세요" },
  { icon: "💬", label: "친목 라운지", desc: "자유롭게 이야기하는 공간" },
];

export default function PreLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* ── YouTube 영상 배경 (배열 순서대로 반복 재생) ── */}
      <div className="video-wrap absolute inset-0 z-0 overflow-hidden">
        <iframe
          className="video-iframe pointer-events-none"
          src={[
            `https://www.youtube.com/embed/${HERO_VIDEO_IDS[0]}`,
            `?autoplay=1`,
            `&mute=1`,
            `&loop=1`,
            `&playlist=${HERO_VIDEO_IDS.join(",")}`, // 전체 목록 → 순서대로 반복
            `&controls=0`,
            `&showinfo=0`,
            `&disablekb=1`,
            `&iv_load_policy=3`,
            `&modestbranding=1`,
            `&rel=0`,
          ].join("")}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="hero background video"
        />
      </div>

      {/* ── 다층 오버레이 ── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/75 via-slate-950/50 to-slate-950" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/40" />
      {/* 스캔라인 텍스처 */}
      <div className="scanline absolute inset-0 z-10" />

      {/* ── 히어로 콘텐츠 ── */}
      <section className="relative z-20 flex min-h-screen flex-col items-start justify-center px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          {/* 배지 */}
          <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              세븐나이츠 리버스 · 공략 &amp; 친목 커뮤니티
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="brand-heading hero-title text-5xl leading-[1.1] text-white md:text-7xl lg:text-8xl">
            함께라면
            <br />
            <span className="gradient-text">더 강해진다</span>
          </h1>

          {/* 서브 카피 */}
          <p className="hero-sub mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            세븐나이츠 리버스 최고의 공략과 함께, 믿을 수 있는 동료를 만나세요.
            <br className="hidden md:block" />
            공략·메타·친목이 한 곳에 모여 있습니다.
          </p>

          {/* CTA 버튼 */}
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

        {/* ── 피처 카드 ── */}
        <div className="hero-features mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="feature-card group flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm font-bold text-white">{f.label}</span>
              <span className="text-xs leading-snug text-slate-400 group-hover:text-slate-300">
                {f.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 스크롤 힌트 ── */}
      <div className="scroll-hint absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">scroll</span>
        <div className="scroll-arrow h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </main>
  );
}
