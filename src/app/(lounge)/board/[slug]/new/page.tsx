import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PostEditorForm } from "@/components/post/post-editor-form";
import { authOptions } from "@/lib/auth";
import { normalizePostCombinationData } from "@/lib/post-combination";
import { prisma } from "@/lib/prisma";
import { ensureSystemBoards } from "@/lib/system-boards";

type BoardPostCreatePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BoardPostCreatePage({ params }: BoardPostCreatePageProps) {
  const { slug } = await params;
  await ensureSystemBoards();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  if (!session?.user?.id) {
    redirect(`/auth/sign-in?callbackUrl=/board/${slug}/new`);
  }

  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, isActive: true, isAdminWriteOnly: true },
  });

  if (!board || !board.isActive) {
    redirect(`/board/${slug}`);
  }

  if (board.isAdminWriteOnly && !isAdmin) {
    redirect(`/board/${slug}`);
  }

  const characters = await prisma.character.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      portraitUrl: true,
      skillOneName: true,
      skillOneImageUrl: true,
      skillTwoName: true,
      skillTwoImageUrl: true,
      passiveName: true,
      passiveImageUrl: true,
    },
  });

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">{board.title}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">새 게시글 작성</h1>
      </header>

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <PostEditorForm
          boardId={board.id}
          boardSlug={board.slug}
          mode="create"
          isAdmin={isAdmin}
          availableCharacters={characters}
          initialCombinationData={normalizePostCombinationData(null)}
        />
      </section>
    </div>
  );
}
