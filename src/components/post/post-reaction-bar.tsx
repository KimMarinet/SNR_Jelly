"use client";

import { useState } from "react";

type PostReactionBarProps = {
  postId: number;
  initialLikeCount: number;
  initialViewCount: number;
  initiallyLiked: boolean;
  canLike: boolean;
};

export function PostReactionBar({
  postId,
  initialLikeCount,
  initialViewCount,
  initiallyLiked,
  canLike,
}: PostReactionBarProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleLike() {
    if (!canLike || loading) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        liked?: boolean;
        likeCount?: number;
        message?: string;
      };

      if (!response.ok || typeof data.liked !== "boolean" || typeof data.likeCount !== "number") {
        throw new Error(data.message ?? "Failed to toggle like.");
      }

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to toggle like.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
      <button
        type="button"
        disabled={!canLike || loading}
        onClick={toggleLike}
        className="rounded-full border border-amber-300/50 px-3 py-1.5 font-semibold text-amber-100 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {liked ? "좋아요 취소" : "좋아요"} · {likeCount}
      </button>
      <span className="rounded-full border border-white/20 px-3 py-1.5 text-zinc-200">
        조회수 {initialViewCount}
      </span>
      {!canLike ? <span className="text-xs text-zinc-400">로그인 후 좋아요 가능</span> : null}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </div>
  );
}
