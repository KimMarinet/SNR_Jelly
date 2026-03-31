import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { PaginationControls } from "@/components/pagination/pagination";
import { authOptions } from "@/lib/auth";
import { getBoardBySlug } from "@/lib/board-navigation";
import { prisma } from "@/lib/prisma";
import { buildPaginationState } from "@/lib/pagination";
import { ensureSystemBoards } from "@/lib/system-boards";

type BoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[]; sort?: string | string[] }>;
};

export const dynamic = "force-dynamic";
const PAGE_SIZE = 5;
const PAGE_WINDOW_SIZE = 10;
type BoardSort = "latest" | "popular";

function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parsePageParam(pageParam: string | string[] | undefined): number {
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }
  return page;
}

function parseSortParam(sortParam: string | string[] | undefined): BoardSort {
  const rawSort = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  if (rawSort === "popular") {
    return rawSort;
  }
  return "latest";
}

function buildBoardPageHref(slug: string, sort: BoardSort, page: number): string {
  const searchParams = new URLSearchParams();

  if (sort !== "latest") {
    searchParams.set("sort", sort);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/board/${slug}?${query}` : `/board/${slug}`;
}

function formatBoardTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { slug } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const requestedPage = parsePageParam(pageParam);
  const currentSort = parseSortParam(sortParam);
  await ensureSystemBoards();
  const session = await getServerSession(authOptions);
  const sessionUserId = Number(session?.user?.id ?? 0);
  const currentUserId = Number.isInteger(sessionUserId) && sessionUserId > 0 ? sessionUserId : null;
  const isAdmin = session?.user?.role === "ADMIN";

  const boardFromDb = await prisma.board.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      isAdminWriteOnly: true,
    },
  });

  const fallbackBoard = boardFromDb ? null : await getBoardBySlug(slug);
  const board = boardFromDb ?? fallbackBoard;
  if (!board) {
    notFound();
  }

  let totalPosts = 0;
  let pagination = buildPaginationState({
    currentPage: requestedPage,
    totalItems: 0,
    itemsPerPage: PAGE_SIZE,
    windowSize: PAGE_WINDOW_SIZE,
  });
  let posts: Array<{
    id: number;
    title: string;
    content: string;
    isPublished: boolean;
    isPinned: boolean;
    likeCount: number;
    viewCount: number;
    createdAt: Date;
    authorId: number;
    author: { email: string; nickname: string };
  }> = [];

  if (boardFromDb) {
    const postWhere = {
      boardId: boardFromDb.id,
      deletedAt: null,
      ...(isAdmin ? {} : { isPublished: true }),
    };
    const filteredPostWhere = postWhere;

    totalPosts = await prisma.post.count({ where: filteredPostWhere });
    pagination = buildPaginationState({
      currentPage: requestedPage,
      totalItems: totalPosts,
      itemsPerPage: PAGE_SIZE,
      windowSize: PAGE_WINDOW_SIZE,
    });
    const skip = (pagination.currentPage - 1) * PAGE_SIZE;
    const orderBy =
      currentSort === "popular"
        ? [{ likeCount: "desc" as const }, { viewCount: "desc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

    posts = await prisma.post.findMany({
      where: filteredPostWhere,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        isPublished: true,
        isPinned: true,
        likeCount: true,
        viewCount: true,
        createdAt: true,
        authorId: true,
        author: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
      });
  }
  const currentPage = pagination.currentPage;
  const totalPages = pagination.totalPages;
  const canWritePost = Boolean(
    currentUserId && boardFromDb && (!boardFromDb.isAdminWriteOnly || isAdmin),
  );
  const totalLabel = boardFromDb
    ? `총 ${totalPosts}건 · ${currentPage}/${totalPages} 페이지`
    : "총 0건";

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">게시판 피드</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{board.title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {board.description ?? "게시판 설명은 준비 중입니다."}
        </p>
      </header>

      {!boardFromDb ? (
        <section className="rounded-2xl border border-dashed border-amber-300/40 bg-amber-300/10 p-6">
          <h2 className="text-lg font-semibold text-amber-100">가데이터 게시판</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-100">
            아직 DB에 실제 게시판이 생성되지 않아 가데이터로 표시하고 있습니다.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-full border border-amber-100/50 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-100/10"
          >
            관리자 화면으로 이동
          </Link>
        </section>
      ) : null}

      <section className="space-y-5 pb-16 md:pb-24">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            {(["latest", "popular"] as const).map((sortKey) => {
              const active = currentSort === sortKey;
              const label = sortKey === "latest" ? "Latest" : "Popular";

              return (
                <Link
                  key={sortKey}
                  href={buildBoardPageHref(board.slug, sortKey, 1)}
                  className={`pb-1 text-xs uppercase tracking-[0.22em] transition ${
                    active
                      ? "border-b-2 border-[#CCFF00] font-bold text-[#CCFF00]"
                      : "text-white/50 hover:text-[#CCFF00]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">{totalLabel}</span>
            {canWritePost ? (
              <Link
                href={`/board/${board.slug}/new`}
                className="group inline-flex w-fit shrink-0 items-center whitespace-nowrap bg-[#CCFF00] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0e0e10] transition hover:brightness-110 active:scale-95"
              >
                <span>Post</span>
              </Link>
            ) : null}
          </div>
        </div>

        {boardFromDb?.isAdminWriteOnly && !isAdmin ? (
          <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            이 게시판은 관리자만 글을 작성할 수 있습니다.
          </p>
        ) : null}

        {posts.length === 0 ? (
          <div className="px-1 py-6 text-sm text-white/45">
            아직 등록된 게시글이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const isAuthor = Boolean(currentUserId && currentUserId === post.authorId);
              const isNewPost = Date.now() - post.createdAt.getTime() < 24 * 60 * 60 * 1000;
              return (
                <article
                  key={post.id}
                  className="group relative border-l-2 border-transparent bg-[#1E1E1E] p-6 transition-all duration-300 hover:border-[#CCFF00] hover:bg-[var(--hub-surface-alt)] md:p-8"
                >
                  <div className="relative z-10">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {isNewPost ? (
                          <span className="border border-[#CCFF00]/20 bg-[#CCFF00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#CCFF00]">
                            NEW
                          </span>
                        ) : null}
                        <time className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                          {formatBoardTimestamp(post.createdAt)}
                        </time>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/board/${board.slug}/${post.id}`}
                        className="block text-2xl font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-[#CCFF00]"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                        {toPlainText(post.content).slice(0, 180)}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-4 text-white/45">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center border border-white/15 bg-white/5 text-[10px] font-bold text-[#CCFF00]">
                            {(post.author.nickname ?? post.author.email).slice(0, 1).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-white/80">
                            {post.author.nickname ?? post.author.email}
                          </span>
                        </div>

                        <div className="hidden h-4 w-px bg-white/10 md:block" />

                        <div className="flex items-center gap-4 text-white/40">
                          <div className="flex items-center gap-1.5 hover:text-[#CCFF00] transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                            <span className="text-[10px] font-bold">{post.likeCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span className="text-[10px] font-bold">{post.viewCount.toLocaleString()}</span>
                          </div>
                          {isAuthor ? <span className="text-[#CCFF00] text-[10px] font-bold uppercase tracking-[0.18em]">Mine</span> : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!post.isPublished ? (
                          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">
                            Private
                          </span>
                        ) : null}
                        <Link
                          href={`/board/${board.slug}/${post.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#CCFF00] transition-all duration-200 hover:translate-x-1 hover:brightness-110"
                        >
                          Read More
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {boardFromDb && totalPages > 1 ? (
          <PaginationControls
            mode="link"
            pagination={pagination}
            pageHrefs={pagination.pageNumbers.map((page) => buildBoardPageHref(board.slug, currentSort, page))}
            previousWindowHref={
              pagination.canGoPrevWindow
                ? buildBoardPageHref(board.slug, currentSort, pagination.previousWindowPage)
                : undefined
            }
            previousHref={
              pagination.canGoPrev ? buildBoardPageHref(board.slug, currentSort, pagination.previousPage) : undefined
            }
            nextHref={
              pagination.canGoNext ? buildBoardPageHref(board.slug, currentSort, pagination.nextPage) : undefined
            }
            nextWindowHref={
              pagination.canGoNextWindow
                ? buildBoardPageHref(board.slug, currentSort, pagination.nextWindowPage)
                : undefined
            }
            className="mt-10 flex flex-wrap items-center justify-center gap-2 pt-2"
            pageClassName="flex h-10 w-10 items-center justify-center border text-xs font-bold transition"
            activePageClassName="border-[#CCFF00] bg-[#CCFF00] text-[#0e0e10]"
            inactivePageClassName="border-white/15 text-white/70 hover:border-[#CCFF00] hover:text-[#CCFF00]"
            navClassName="flex h-10 w-10 items-center justify-center text-white/40 transition hover:text-[#CCFF00]"
            navDisabledClassName="flex h-10 w-10 items-center justify-center text-white/25"
          />
        ) : null}

      </section>
    </div>
  );
}
