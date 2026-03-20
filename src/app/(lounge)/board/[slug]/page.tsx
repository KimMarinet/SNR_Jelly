import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/board-navigation";
import { prisma } from "@/lib/prisma";

type BoardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BoardPlaceholderPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const boardFromDb = await prisma.board.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
    },
  });

  const fallbackBoard = boardFromDb ? null : await getBoardBySlug(slug);

  const board = boardFromDb ?? fallbackBoard;

  if (!board) {
    notFound();
  }

  const posts = boardFromDb
    ? await prisma.post.findMany({
        where: {
          boardId: boardFromDb.id,
          isPublished: true,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              email: true,
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Board Feed</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{board.title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {board.description ?? "게시판 설명은 준비 중입니다."}
        </p>
      </header>

      {!boardFromDb ? (
        <section className="rounded-2xl border border-dashed border-amber-300/40 bg-amber-300/10 p-6">
          <h2 className="text-lg font-semibold text-amber-100">가데이터 게시판</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-100">
            현재 DB에 실제 게시판이 생성되지 않아 Mock 메뉴로 연결되었습니다.
            `/admin`에서 게시판을 생성하면 실데이터 목록으로 전환됩니다.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-full border border-amber-100/50 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-100/10"
          >
            관리자 패널 열기
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">게시글 목록</h2>
          <span className="text-xs text-zinc-300">총 {posts.length}건</span>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
            아직 등록된 게시글이 없습니다. Phase 4 전 단계에서는 관리자 및 테스트
            데이터 투입 후 목록이 확장됩니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                <p className="mt-2 max-h-12 overflow-hidden text-sm text-zinc-200">
                  {post.content}
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  작성자: {post.author.email} | 작성일:{" "}
                  {new Date(post.createdAt).toLocaleString("ko-KR")}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/lounge"
          className="mt-5 inline-block rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          라운지로 복귀
        </Link>
      </section>
    </div>
  );
}
