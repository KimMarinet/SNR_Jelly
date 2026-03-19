import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/board-navigation";

type BoardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BoardPlaceholderPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          Board Placeholder
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{board.title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {board.description ?? "세부 게시판 소개는 Phase 3에서 확정됩니다."}
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-amber-300/40 bg-amber-300/10 p-6">
        <h2 className="text-lg font-semibold text-amber-100">Phase 3 예정 기능</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-100">
          게시글 목록 조회, 상세 화면, 관리자 CRUD 동기화가 다음 단계에서 이
          경로에 연결됩니다.
        </p>
        <Link
          href="/lounge"
          className="mt-4 inline-block rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          라운지로 복귀
        </Link>
      </section>
    </div>
  );
}
