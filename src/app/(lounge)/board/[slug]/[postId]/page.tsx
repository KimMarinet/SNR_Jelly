import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PostCommentSection } from "@/components/post/post-comment-section";
import { PostReactionBar } from "@/components/post/post-reaction-bar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BoardPostDetailPageProps = {
  params: Promise<{ slug: string; postId: string }>;
};

export const dynamic = "force-dynamic";

function parsePostId(rawPostId: string): number | null {
  const id = Number(rawPostId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default async function BoardPostDetailPage({ params }: BoardPostDetailPageProps) {
  const { slug, postId: rawPostId } = await params;
  const postId = parsePostId(rawPostId);
  if (!postId) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = Number(session?.user?.id ?? 0);
  const currentUserId = Number.isInteger(sessionUserId) && sessionUserId > 0 ? sessionUserId : null;

  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, isActive: true, isAdminWriteOnly: true },
  });
  if (!board) {
    notFound();
  }
  const boardIsAdminWriteOnly = board.isAdminWriteOnly;

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      boardId: board.id,
      deletedAt: null,
      ...(currentUserId ? {} : { isPublished: true }),
    },
    select: {
      id: true,
      boardId: true,
      authorId: true,
      title: true,
      content: true,
      isPublished: true,
      likeCount: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          email: true,
          nickname: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const canManage =
    isAdmin || (!boardIsAdminWriteOnly && currentUserId === post.authorId);
  const targetPostId = post.id;
  const targetAuthorId = post.authorId;

  if (!post.isPublished && !canManage) {
    notFound();
  }

  let effectiveViewCount = post.viewCount;
  let initiallyLiked = false;

  if (currentUserId) {
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.postView.createMany({
        data: [
          {
            postId: targetPostId,
            userId: currentUserId,
          },
        ],
        skipDuplicates: true,
      });
      const incremented = created.count === 1;

      if (incremented) {
        await tx.post.update({
          where: { id: targetPostId },
          data: { viewCount: { increment: 1 } },
        });
      }

      const liked = await tx.postLike.findUnique({
        where: {
          postId_userId: {
            postId: targetPostId,
            userId: currentUserId,
          },
        },
        select: { id: true },
      });

      return {
        incremented,
        liked: Boolean(liked),
      };
    });

    if (result.incremented) {
      effectiveViewCount += 1;
    }
    initiallyLiked = result.liked;
  }

  const comments = await prisma.comment.findMany({
    where: { postId: targetPostId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          email: true,
          nickname: true,
        },
      },
    },
  });

  const initialComments = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    authorId: comment.authorId,
    authorEmail: comment.author.email,
    authorNickname: comment.author.nickname,
  }));

  async function handleDelete() {
    "use server";

    if (!currentUserId) {
      redirect(`/auth/sign-in?callbackUrl=/board/${slug}/${targetPostId}`);
    }

    const canDelete = isAdmin || (!boardIsAdminWriteOnly && currentUserId === targetAuthorId);
    if (!canDelete) {
      return;
    }

    await prisma.post.delete({ where: { id: targetPostId } });
    redirect(`/board/${slug}`);
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">{board.title}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{post.title}</h1>
        <p className="mt-2 text-sm text-zinc-300">
          작성자 {post.author.nickname ?? post.author.email} · {new Date(post.createdAt).toLocaleString("ko-KR")}
        </p>
      </header>

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <PostReactionBar
          postId={post.id}
          initialLikeCount={post.likeCount}
          initialViewCount={effectiveViewCount}
          initiallyLiked={initiallyLiked}
          canLike={Boolean(currentUserId)}
        />

        {!post.isPublished ? (
          <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            비공개 게시글입니다. 관리자와 작성자에게만 보입니다.
          </p>
        ) : null}

        <article
          className="prose prose-invert mt-6 max-w-none text-zinc-100"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href={`/board/${slug}`}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            목록으로
          </Link>

          {canManage ? (
            <>
              <Link
                href={`/board/${slug}/${post.id}/edit`}
                className="rounded-full border border-cyan-300/50 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/10"
              >
                수정
              </Link>
              <form action={handleDelete}>
                <button
                  type="submit"
                  className="rounded-full border border-rose-300/50 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/10"
                >
                  삭제
                </button>
              </form>
            </>
          ) : null}
        </div>
      </section>

      <PostCommentSection
        postId={targetPostId}
        currentUserId={currentUserId}
        isAdmin={Boolean(isAdmin)}
        initialComments={initialComments}
      />
    </div>
  );
}
