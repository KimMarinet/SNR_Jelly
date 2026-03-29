import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PostEditorForm } from "@/components/post/post-editor-form";
import { authOptions } from "@/lib/auth";
import { normalizePostCombinationData } from "@/lib/post-combination";
import { prisma } from "@/lib/prisma";
import { ensureSystemBoards } from "@/lib/system-boards";

type BoardPostEditPageProps = {
  params: Promise<{ slug: string; postId: string }>;
};

function parsePostId(rawPostId: string): number | null {
  const id = Number(rawPostId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default async function BoardPostEditPage({ params }: BoardPostEditPageProps) {
  const { slug, postId: rawPostId } = await params;
  const postId = parsePostId(rawPostId);
  if (!postId) {
    notFound();
  }

  await ensureSystemBoards();

  const session = await getServerSession(authOptions);
  const sessionUserId = Number(session?.user?.id ?? 0);
  const currentUserId = Number.isInteger(sessionUserId) && sessionUserId > 0 ? sessionUserId : null;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!currentUserId) {
    redirect(`/auth/sign-in?callbackUrl=/board/${slug}/${postId}/edit`);
  }

  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, isAdminWriteOnly: true },
  });
  if (!board) {
    notFound();
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      boardId: board.id,
      deletedAt: null,
    },
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      combinationData: true,
      isPinned: true,
    },
  });
  if (!post) {
    notFound();
  }

  const canEdit =
    isAdmin || (!board.isAdminWriteOnly && post.authorId === currentUserId);
  if (!canEdit) {
    redirect(`/board/${slug}/${post.id}`);
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
        <h1 className="mt-2 text-3xl font-semibold text-white">게시글 수정</h1>
      </header>

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <PostEditorForm
          boardId={board.id}
          boardSlug={board.slug}
          mode="edit"
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
          isAdmin={isAdmin}
          initialIsPinned={post.isPinned}
          availableCharacters={characters}
          initialCombinationData={normalizePostCombinationData(post.combinationData)}
        />
      </section>
    </div>
  );
}
