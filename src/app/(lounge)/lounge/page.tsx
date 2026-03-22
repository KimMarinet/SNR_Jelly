import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "세븐나이츠 리버스 라운지 허브",
  description: "공지, 공략, 트렌드를 빠르게 확인하는 메인 라운지",
};

export const revalidate = 300;

const EXTERNAL_LINKS = [
  { href: "https://game.naver.com/lounge/sena_rebirth/home", label: "공식 라운지 바로가기" },
  { href: "https://sena.netmarble.com/ko/pcplay", label: "게임 다운로드" },
  { href: "https://www.youtube.com/@sena_rebirth", label: "공식 영상 채널" },
];

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
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

function BriefingCard({
  label,
  accentClass,
  borderClass,
  emptyMessage,
  posts,
}: {
  label: string;
  accentClass: string;
  borderClass: string;
  emptyMessage: string;
  posts: BriefingPost[];
}) {
  return (
    <article
      className={[
        "flex flex-col rounded-2xl border bg-white/5 p-4 transition",
        borderClass,
      ].join(" ")}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${accentClass}`}>{label}</p>

      {posts.length === 0 ? (
        <p className="mt-4 flex-1 text-sm text-zinc-500 italic">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 flex-1 space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/board/${post.board.slug}/${post.id}`} className="group flex flex-col gap-0.5">
                <span className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-amber-200">
                  {post.title}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span>{post.board.title}</span>
                  <span>·</span>
                  <span>조회 {post.viewCount.toLocaleString()}</span>
                  <span>·</span>
                  <span>{formatDate(post.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default async function LoungeHomePage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [pinnedPosts, topGuidePosts, hotTrendPosts] = await Promise.all([
    prisma.post.findMany({
      where: { isPinned: true, isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        isPinned: false,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { viewCount: "desc" },
      take: 3,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        createdAt: { gte: fortyEightHoursAgo },
      },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: postSelect,
    }),
  ]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_top_right,#f59e0b33,transparent_40%),linear-gradient(150deg,#0b1226_0%,#111827_45%,#1d2233_100%)] p-6 md:p-10">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-36 w-36 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Handler One Briefing</p>
          <h1 className="brand-heading mt-3 text-3xl leading-tight text-white md:text-5xl">세븐나이츠 리버스 공략 허브</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200 md:text-base">
            공지, 베스트 공략, 실시간 트렌드를 한곳에서 확인하고 전투 준비를 빠르게 끝내세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/board/notice"
              className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              필독 공지 확인
            </Link>
            <Link
              href="/board/strategy"
              className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              베스트 공략 보러가기
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white md:text-2xl">주요 정보 브리핑</h2>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            실시간 업데이트
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <BriefingCard
            label="필독 공지"
            accentClass="text-amber-300"
            borderClass="border-amber-400/25 hover:border-amber-300/50"
            emptyMessage="현재 고정 공지가 없습니다."
            posts={pinnedPosts}
          />

          <BriefingCard
            label="이번 주 베스트 공략"
            accentClass="text-cyan-300"
            borderClass="border-cyan-400/20 hover:border-cyan-300/40"
            emptyMessage="이번 주 공략 게시글이 없습니다."
            posts={topGuidePosts}
          />

          <BriefingCard
            label="핫 트렌드"
            accentClass="text-rose-300"
            borderClass="border-rose-400/20 hover:border-rose-300/40"
            emptyMessage="최근 48시간 내 게시글이 없습니다."
            posts={hotTrendPosts}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-gradient-to-r from-slate-900/60 via-slate-800/50 to-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">외부 링크</h2>
        <p className="mt-1 text-sm text-zinc-200">공식 채널과 다운로드 페이지를 빠르게 확인하세요.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-amber-300/50 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
