"use client";

import { FormEvent, useMemo, useState } from "react";
import { readJson } from "./http";
import type { AdminLandingVideo } from "./types";

type LandingVideoManagerProps = {
  initialVideos: AdminLandingVideo[];
  onStatus: (message: string) => void;
};

function sortVideos(videos: AdminLandingVideo[]) {
  return [...videos].sort((a, b) => a.order - b.order || a.id - b.id);
}

function toDateString(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ko-KR");
}

export function LandingVideoManager({
  initialVideos,
  onStatus,
}: LandingVideoManagerProps) {
  const [videos, setVideos] = useState(sortVideos(initialVideos));
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: "",
    youtubeId: "",
    order: "0",
    isActive: true,
  });

  const sortedVideos = useMemo(() => sortVideos(videos), [videos]);

  async function createVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    onStatus("");

    try {
      const response = await fetch("/api/admin/landing-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVideo.title,
          youtubeId: newVideo.youtubeId,
          order: Number(newVideo.order),
          isActive: newVideo.isActive,
        }),
      });
      const data = await readJson<{ video: AdminLandingVideo }>(response);
      setVideos((prev) => sortVideos([data.video, ...prev]));
      setNewVideo({ title: "", youtubeId: "", order: "0", isActive: true });
      onStatus(`랜딩 영상이 추가되었습니다: ${data.video.youtubeId}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "랜딩 영상 추가에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  function updateLocalVideo(
    id: number,
    key: keyof Pick<AdminLandingVideo, "title" | "youtubeId" | "order" | "isActive">,
    value: string | number | boolean | null,
  ) {
    setVideos((prev) => prev.map((video) => (video.id === id ? { ...video, [key]: value } : video)));
  }

  async function saveVideo(video: AdminLandingVideo) {
    setSavingId(video.id);
    onStatus("");

    try {
      const response = await fetch(`/api/admin/landing-videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          youtubeId: video.youtubeId,
          order: video.order,
          isActive: video.isActive,
        }),
      });
      const data = await readJson<{ video: AdminLandingVideo }>(response);
      setVideos((prev) => sortVideos(prev.map((item) => (item.id === video.id ? data.video : item))));
      onStatus("랜딩 영상 설정을 저장했습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "랜딩 영상 저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeVideo(video: AdminLandingVideo) {
    if (!window.confirm(`영상 ${video.youtubeId} 를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(video.id);
    onStatus("");

    try {
      const response = await fetch(`/api/admin/landing-videos/${video.id}`, {
        method: "DELETE",
      });
      await readJson(response);
      setVideos((prev) => prev.filter((item) => item.id !== video.id));
      onStatus("랜딩 영상을 삭제했습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "랜딩 영상 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/30 p-5">
      <h2 className="text-lg font-semibold text-white">랜딩 영상 관리</h2>
      <p className="mt-1 text-sm text-zinc-300">
        루트 랜딩 페이지(`/`)에서 순서대로 재생할 YouTube 영상을 관리합니다.
      </p>

      <form onSubmit={createVideo} className="mt-4 grid gap-3 md:grid-cols-5">
        <input
          value={newVideo.title}
          onChange={(event) => setNewVideo((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="영상 제목(선택)"
          className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none md:col-span-2"
        />
        <input
          value={newVideo.youtubeId}
          onChange={(event) =>
            setNewVideo((prev) => ({ ...prev, youtubeId: event.target.value.trim() }))
          }
          placeholder="YouTube URL 또는 ID"
          required
          className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none md:col-span-2"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={newVideo.order}
            onChange={(event) => setNewVideo((prev) => ({ ...prev, order: event.target.value }))}
            className="w-20 rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
          />
          <label className="inline-flex items-center gap-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={newVideo.isActive}
              onChange={(event) =>
                setNewVideo((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            활성
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? "추가 중..." : "영상 추가"}
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {sortedVideos.length === 0 ? (
          <p className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-zinc-300">
            등록된 랜딩 영상이 없습니다.
          </p>
        ) : (
          sortedVideos.map((video) => (
            <article key={video.id} className="rounded-xl border border-white/15 bg-black/35 p-3">
              <div className="grid gap-3 md:grid-cols-8">
                <div className="md:col-span-3">
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    <iframe
                      className="h-32 w-full"
                      src={`https://www.youtube.com/embed/${video.youtubeId}?controls=0&rel=0`}
                      title={`landing-video-${video.id}`}
                      loading="lazy"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-cyan-300 hover:underline"
                  >
                    YouTube에서 열기
                  </a>
                </div>

                <div className="grid gap-2 md:col-span-5 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">제목</span>
                    <input
                      value={video.title ?? ""}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "title", event.target.value || null)
                      }
                      className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">YouTube URL/ID</span>
                    <input
                      value={video.youtubeId}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "youtubeId", event.target.value.trim())
                      }
                      className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">표시 순서</span>
                    <input
                      type="number"
                      value={video.order}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "order", Number(event.target.value))
                      }
                      className="w-28 rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="inline-flex items-center gap-1 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={video.isActive}
                        onChange={(event) =>
                          updateLocalVideo(video.id, "isActive", event.target.checked)
                        }
                      />
                      활성
                    </label>
                    <button
                      type="button"
                      disabled={savingId === video.id}
                      onClick={() => saveVideo(video)}
                      className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-60"
                    >
                      {savingId === video.id ? "저장 중..." : "적용"}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === video.id}
                      onClick={() => removeVideo(video)}
                      className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-100 disabled:opacity-60"
                    >
                      {deletingId === video.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 md:col-span-2">
                    최근 수정: {toDateString(video.updatedAt)}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
