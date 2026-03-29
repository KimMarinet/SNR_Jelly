import Link from "next/link";
import type { Metadata } from "next";
import { CombinationSection } from "@/components/lounge/combination-section";
import { prisma } from "@/lib/prisma";
import { ensureSystemBoards } from "@/lib/system-boards";

export const metadata: Metadata = {
  title: "SNR 젤리",
  description: "게시판 허브 스타일 기반의 라운지 메인",
};

export const revalidate = 300;
const EXTERNAL_LINKS = [
  { href: "https://game.naver.com/lounge/sena_rebirth/home", label: "공식 라운지" },
  { href: "https://sena.netmarble.com/ko/pcplay", label: "게임 다운로드" },
  { href: "https://www.youtube.com/@sena_rebirth/videos", label: "공식 유튜브" },
] as const;

const postSelect = {
  id: true,
  title: true,
  content: true,
  viewCount: true,
  createdAt: true,
  board: { select: { slug: true, title: true } },
} as const;

const tacticalPostSelect = {
  id: true,
  title: true,
  content: true,
  likeCount: true,
  viewCount: true,
  createdAt: true,
  board: { select: { slug: true, title: true } },
} as const;

type PostSummary = {
  id: number;
  title: string;
  viewCount: number;
  createdAt: Date;
  board: { slug: string; title: string };
};

type BoardHubItem = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  postCount: number;
  latestPostAt: Date | null;
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function extractFirstImageUrl(content: string): string | null {
  const htmlImgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImgMatch?.[1]) {
    return htmlImgMatch[1];
  }

  const markdownImgMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownImgMatch?.[1]) {
    return markdownImgMatch[1];
  }

  return null;
}

function toPlainText(content: string, max = 120): string {
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trimEnd()}...`;
}

function getBoardCode(slug: string): string {
  const value = slug.toUpperCase();
  return value.length >= 3 ? value.slice(0, 3) : value.padEnd(3, "X");
}

function HubSectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <h2
        className="text-2xl font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
        style={{ color: "var(--hub-accent)" }}
      >
        {title}
      </h2>
      <div
        className="h-px flex-1"
        style={{
          background: "linear-gradient(90deg, color-mix(in srgb, var(--hub-accent) 30%, transparent) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

export default async function LoungeHomePage() {
  await ensureSystemBoards();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [pinnedPosts, topGuidePosts, hotTrendPosts, tacticalPosts, boards] = await Promise.all([
    prisma.post.findMany({
      where: { isPinned: true, isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 4,
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
      take: 4,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        createdAt: { gte: fortyEightHoursAgo },
      },
      orderBy: { viewCount: "desc" },
      take: 6,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        board: {
          is: {
            slug: { not: "notice" },
          },
        },
      },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: tacticalPostSelect,
    }),
    prisma.board.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      take: 24,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        _count: {
          select: {
            posts: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
          },
        },
        posts: {
          where: {
            isPublished: true,
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);

  const boardHubItems: BoardHubItem[] = boards.map((board) => ({
    id: board.id,
    slug: board.slug,
    title: board.title,
    description: board.description,
    postCount: board._count.posts,
    latestPostAt: board.posts[0]?.createdAt ?? null,
  }));

  const featuredBoardSlug =
    boardHubItems.find((board) => board.slug === "strategy")?.slug ??
    boardHubItems[1]?.slug ??
    boardHubItems[0]?.slug ??
    "notice";
  const noticeBoardSlug =
    boardHubItems.find((board) => board.slug === "notice")?.slug ?? boardHubItems[0]?.slug ?? "notice";

  const leadPost = hotTrendPosts[0] ?? topGuidePosts[0] ?? pinnedPosts[0] ?? null;
  const leadPostImage = leadPost ? extractFirstImageUrl(leadPost.content) : null;
  const activityFeed: PostSummary[] = [...hotTrendPosts, ...topGuidePosts, ...pinnedPosts]
    .filter((post, index, list) => list.findIndex((target) => target.id === post.id) === index)
    .slice(0, 5);

  return (
    <div className="space-y-20 py-2 md:py-4">
      <header className="border-b pb-10" style={{ borderColor: "var(--hub-border)" }}>
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full"
                  style={{ backgroundColor: "color-mix(in srgb, var(--hub-accent) 58%, var(--hub-bg) 42%)" }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: "color-mix(in srgb, var(--hub-accent) 62%, var(--hub-bg) 38%)" }}
                />
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-space-grotesk),sans-serif]"
                style={{ color: "color-mix(in srgb, var(--hub-muted) 78%, var(--hub-accent) 22%)" }}
              >
                Terminal / Communication Nodes
              </span>
            </div>

            <h1
              className="text-5xl font-black uppercase leading-[0.9] tracking-tighter md:text-7xl [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-text)" }}
            >
              <span className="inline-flex items-end gap-2">
                <span className="text-[1.1em] leading-none">SNR</span>
                <span
                  className="relative inline-block text-[1.03em] leading-none tracking-[0.01em]"
                  style={{ color: "var(--hub-accent)" }}
                >
                  {"\uC824\uB9AC"}
                </span>
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "color-mix(in srgb, var(--hub-muted) 82%, var(--hub-bg) 18%)" }}>
              <span className="block">세븐나이츠 리버스 게임 정보를 함께 나누는 커뮤니티 게시판입니다.</span>
              <span className="block">공략, 육성 팁, 업데이트 소식까지 필요한 정보를 한곳에서 확인해 보세요.</span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/board/${noticeBoardSlug}`}
                className="hub-ghost-button inline-flex items-center rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur-sm transition"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--hub-surface) 58%, transparent)",
                }}
              >
                <span className="hub-ghost-button-text">Notice</span>
              </Link>
              <Link
                href={`/board/${featuredBoardSlug}`}
                data-tone="secondary"
                className="hub-ghost-button inline-flex items-center rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur-sm transition"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--hub-surface) 58%, transparent)",
                }}
              >
                <span className="hub-ghost-button-text">Enter Main Board</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section>
        <HubSectionHeader title="Tactical Boards" />

        {tacticalPosts.length === 0 ? (
          <div
            className="border p-10 text-center text-sm"
            style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)", color: "var(--hub-muted)" }}
          >
            아직 등록된 게시글이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[1px] md:grid-cols-2 xl:grid-cols-3" style={{ backgroundColor: "var(--hub-border)" }}>
            {tacticalPosts.map((post) => {
              const previewImage = extractFirstImageUrl(post.content);
              const previewText = toPlainText(post.content);

              return (
              <Link
                key={post.id}
                href={`/board/${post.board.slug}/${post.id}`}
                className="group relative overflow-hidden border-l-2 p-8 transition-all duration-200"
                style={{
                  borderColor: "transparent",
                  backgroundColor: "var(--hub-surface)",
                }}
              >
                {previewImage ? (
                  <>
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url("${previewImage}")` }}
                    />
                    <div className="absolute inset-0" style={{ backgroundColor: "var(--hub-image-overlay)" }} />
                  </>
                ) : null}

                <div className="relative z-10">
                <div className="mb-6 flex items-start justify-between">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center border text-xs font-bold [font-family:var(--font-space-grotesk),sans-serif]"
                    style={{
                      borderColor: "var(--hub-border)",
                      backgroundColor: previewImage ? "var(--hub-image-panel)" : "var(--hub-surface-alt)",
                      color: "var(--hub-accent)",
                    }}
                  >
                    {getBoardCode(post.board.slug)}
                  </span>
                  <span
                    className="rounded-[2px] px-2 py-1 text-[10px] uppercase tracking-wide [font-family:var(--font-space-grotesk),sans-serif]"
                    style={{
                      backgroundColor: previewImage ? "var(--hub-image-chip)" : "var(--hub-surface-soft)",
                      color: previewImage ? "var(--hub-image-text-soft)" : "var(--hub-muted)",
                    }}
                  >
                    LIKE {post.likeCount.toLocaleString()}
                  </span>
                </div>

                <h3
                  className="mb-2 text-xl font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
                  style={{ color: previewImage ? "var(--hub-image-text)" : "var(--hub-text)" }}
                >
                  {post.title}
                </h3>
                <p
                  className="mb-8 line-clamp-3 text-sm leading-relaxed"
                  style={{ color: previewImage ? "var(--hub-image-text-soft)" : "var(--hub-muted)" }}
                >
                  {previewText || "\uBCF8\uBB38 \uBBF8\uB9AC\uBCF4\uAE30\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: previewImage ? "var(--hub-image-text-soft)" : "var(--hub-muted)" }}>
                    {post.board.title} / {"\uC870\uD68C"} {post.viewCount.toLocaleString()}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100 [font-family:var(--font-space-grotesk),sans-serif]"
                    style={{ color: "var(--hub-accent)" }}
                  >
                    ENTER TERMINAL
                    <span aria-hidden>{">"}</span>
                  </div>
                </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article
          className="relative overflow-hidden border lg:col-span-8"
          style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}
        >
          {leadPostImage ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${leadPostImage}")` }}
              />
              <div className="absolute inset-0" style={{ backgroundColor: "var(--hub-image-overlay)" }} />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 15%, var(--hub-hero-glow-a), transparent 45%), radial-gradient(circle at 80% 85%, var(--hub-hero-glow-b), transparent 35%)",
              }}
            />
          )}
          <div
            className="relative z-10 flex h-full min-h-[300px] flex-col justify-end p-8"
            style={{
              background: leadPostImage
                ? "linear-gradient(to top, color-mix(in srgb, var(--hub-bg) 70%, transparent) 0%, color-mix(in srgb, var(--hub-bg) 42%, transparent) 52%, transparent 100%)"
                : "linear-gradient(to top, color-mix(in srgb, var(--hub-bg) 98%, transparent) 0%, color-mix(in srgb, var(--hub-bg) 80%, transparent) 52%, transparent 100%)",
            }}
          >
            <span
              className="mb-3 text-[10px] uppercase tracking-[0.2em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Trending Hot
            </span>
            {leadPost ? (
              <>
                <Link
                  href={`/board/${leadPost.board.slug}/${leadPost.id}`}
                  className="text-3xl font-black uppercase leading-tight tracking-tight transition [font-family:var(--font-space-grotesk),sans-serif]"
                  style={{ color: leadPostImage ? "var(--hub-image-text)" : "var(--hub-text)" }}
                >
                  {leadPost.title}
                </Link>
                <p className="mt-3 text-xs uppercase tracking-wider" style={{ color: leadPostImage ? "var(--hub-image-text-soft)" : "var(--hub-muted)" }}>
                  {leadPost.board.title} / {"\uC870\uD68C"} {leadPost.viewCount.toLocaleString()} / {formatDate(leadPost.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--hub-muted)" }}>
                실시간 트렌드 게시글이 없습니다.
              </p>
            )}
          </div>
        </article>

        <aside className="space-y-4 lg:col-span-4">
          <div className="border p-5" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface-alt)" }}>
            <h3
              className="text-lg font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              실시간 활동
            </h3>
            <div className="mt-4 space-y-3">
              {activityFeed.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--hub-muted)" }}>
                  활동 로그가 없습니다.
                </p>
              ) : (
                activityFeed.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/board/${post.board.slug}/${post.id}`}
                    className="block border-l pl-3 text-xs leading-relaxed transition"
                    style={{
                      borderColor: index === 0 ? "var(--hub-accent)" : "var(--hub-border)",
                      color: "var(--hub-muted)",
                    }}
                  >
                    <span style={{ color: "var(--hub-text)" }}>{post.board.title}</span> / {post.title}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border p-5" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}>
            <h3
              className="text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-muted)" }}
            >
              Briefing
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p style={{ color: "var(--hub-text)" }}>Pinned Notices: {pinnedPosts.length}</p>
              <p style={{ color: "var(--hub-text)" }}>Weekly Best: {topGuidePosts.length}</p>
              <p style={{ color: "var(--hub-text)" }}>48h Trend: {hotTrendPosts.length}</p>
            </div>
          </div>
        </aside>
      </section>

      <CombinationSection />

      <section>
        <HubSectionHeader title="Resource Nexus" />
        <div className="grid grid-cols-1 gap-[1px] md:grid-cols-3" style={{ backgroundColor: "var(--hub-border)" }}>
          {EXTERNAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="hub-resource-link cursor-pointer p-[18px] md:p-5"
              style={{
                backgroundColor: "var(--hub-surface)",
              }}
            >
              <p
                className="hub-resource-meta text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
                style={{ color: "var(--hub-muted)" }}
              >
                외부 링크
              </p>
              <p
                className="hub-resource-title mt-2 text-lg font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
                style={{ color: "var(--hub-text)" }}
              >
                {item.label}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

