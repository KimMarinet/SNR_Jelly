"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type PostCommentItem = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  authorEmail: string;
  authorNickname: string;
};

type PostCommentSectionProps = {
  postId: number;
  currentUserId: number | null;
  isAdmin: boolean;
  initialComments: PostCommentItem[];
};

export function PostCommentSection({
  postId,
  currentUserId,
  isAdmin,
  initialComments,
}: PostCommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserId || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        comment?: {
          id: number;
          content: string;
          createdAt: string;
          updatedAt: string;
          authorId: number;
          author: { email: string; nickname: string };
        };
        message?: string;
      };
      const createdComment = data.comment;

      if (!response.ok || !createdComment) {
        throw new Error(data.message ?? "댓글 등록에 실패했습니다.");
      }

      setComments((prev) => [
        ...prev,
        {
          id: createdComment.id,
          content: createdComment.content,
          createdAt: createdComment.createdAt,
          updatedAt: createdComment.updatedAt,
          authorId: createdComment.authorId,
          authorEmail: createdComment.author.email,
          authorNickname: createdComment.author.nickname,
        },
      ]);
      setDraft("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateComment(commentId: number) {
    if (!editingDraft.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingDraft }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        comment?: {
          id: number;
          content: string;
          updatedAt: string;
        };
        message?: string;
      };

      if (!response.ok || !data.comment) {
        throw new Error(data.message ?? "댓글 수정에 실패했습니다.");
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                content: data.comment?.content ?? comment.content,
                updatedAt: data.comment?.updatedAt ?? comment.updatedAt,
              }
            : comment,
        ),
      );
      setEditingId(null);
      setEditingDraft("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "댓글 삭제에 실패했습니다.");
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">댓글</h2>
        <span className="text-xs text-zinc-300">{comments.length}개</span>
      </header>

      {currentUserId ? (
        <form onSubmit={handleCreateComment} className="mb-5 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="댓글을 입력하세요."
            minLength={1}
            maxLength={1000}
            required
            className="min-h-24 w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full border border-emerald-300/50 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/10 disabled:opacity-60"
            >
              {submitting ? "처리 중..." : "댓글 등록"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
          댓글 작성은 로그인 후 이용할 수 있습니다.
        </p>
      )}

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {comments.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
          아직 등록된 댓글이 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const canManage = comment.authorId === currentUserId || isAdmin;

            return (
              <li key={comment.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-zinc-400">
                  {comment.authorNickname || comment.authorEmail} ·{" "}
                  {new Date(comment.createdAt).toLocaleString("ko-KR")}
                </p>

                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      minLength={1}
                      maxLength={1000}
                      className="min-h-20 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingDraft("");
                        }}
                        className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-zinc-200"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUpdateComment(comment.id)}
                        disabled={submitting}
                        className="rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-100 disabled:opacity-60"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{comment.content}</p>
                )}

                {canManage && editingId !== comment.id ? (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditingDraft(comment.content);
                      }}
                      className="rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-100"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(comment.id)}
                      disabled={submitting}
                      className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-100 disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
