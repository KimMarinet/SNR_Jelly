import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBoardBySlug } from "@/lib/board-navigation";
import { prisma } from "@/lib/prisma";

type BoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export const dynamic = "force-dynamic";
const PAGE_SIZE = 5;
const PAGE_WINDOW_SIZE = 10;

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

function buildBoardPageHref(slug: string, page: number): string {
  return page <= 1 ? `/board/${slug}` : `/board/${slug}?page=${page}`;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePageParam(pageParam);
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
  let totalPages = 1;
  let currentPage = 1;
  let posts: Array<{
    id: number;
    title: string;
    content: string;
    isPublished: boolean;
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

    totalPosts = await prisma.post.count({ where: postWhere });
    totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
    currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * PAGE_SIZE;

    posts = await prisma.post.findMany({
      where: postWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        isPublished: true,
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

  const windowStart = Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
  const windowEnd = Math.min(windowStart + PAGE_WINDOW_SIZE - 1, totalPages);
  const pageNumbers = Array.from(
    { length: Math.max(0, windowEnd - windowStart + 1) },
    (_, index) => windowStart + index,
  );

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const canGoPrevWindow = windowStart > 1;
  const canGoNextWindow = windowEnd < totalPages;
  const canWritePost = Boolean(
    currentUserId && boardFromDb && (!boardFromDb.isAdminWriteOnly || isAdmin),
  );

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

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-white">게시글 목록</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-300">
              총 {totalPosts}건 {boardFromDb ? `· ${currentPage}/${totalPages} 페이지` : ""}
            </span>
            {canWritePost ? (
              <Link
                href={`/board/${board.slug}/new`}
                className="rounded-full border border-emerald-300/50 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/10"
              >
                글쓰기
              </Link>
            ) : null}
          </div>
        </div>

        {boardFromDb?.isAdminWriteOnly && !isAdmin ? (
          <p className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            이 게시판은 관리자만 글을 작성할 수 있습니다.
          </p>
        ) : null}

        {posts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
            아직 등록된 게시글이 없습니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const isMine = currentUserId === post.authorId;
              return (
                <li key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/board/${board.slug}/${post.id}`}
                      className="text-lg font-semibold text-white underline-offset-4 hover:underline"
                    >
                      {post.title}
                    </Link>
                    {!post.isPublished ? (
                      <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-xs text-amber-200">
                        비공개
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{toPlainText(post.content).slice(0, 180)}</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    작성자 {post.author.nickname ?? post.author.email}
                    {isMine ? " (내 글)" : ""} · {new Date(post.createdAt).toLocaleString("ko-KR")} · 좋아요 {post.likeCount}
                    · 조회수 {post.viewCount}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {boardFromDb && totalPages > 1 ? (
          <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label="게시글 페이지 이동">
            {canGoPrevWindow ? (
              <Link
                href={buildBoardPageHref(board.slug, Math.max(1, currentPage - PAGE_WINDOW_SIZE))}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                {"<<"}
              </Link>
            ) : (
              <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                {"<<"}
              </span>
            )}

            {canGoPrev ? (
              <Link
                href={buildBoardPageHref(board.slug, currentPage - 1)}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                {"<"}
              </Link>
            ) : (
              <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                {"<"}
              </span>
            )}

            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={buildBoardPageHref(board.slug, pageNumber)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  pageNumber === currentPage
                    ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-100"
                    : "border-white/25 text-zinc-100 hover:bg-white/10"
                }`}
              >
                {pageNumber}
              </Link>
            ))}

            {canGoNext ? (
              <Link
                href={buildBoardPageHref(board.slug, currentPage + 1)}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                {">"}
              </Link>
            ) : (
              <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                {">"}
              </span>
            )}

            {canGoNextWindow ? (
              <Link
                href={buildBoardPageHref(board.slug, Math.min(totalPages, currentPage + PAGE_WINDOW_SIZE))}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                {">>"}
              </Link>
            ) : (
              <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                {">>"}
              </span>
            )}
          </nav>
        ) : null}

      </section>
    </div>
  );
}
