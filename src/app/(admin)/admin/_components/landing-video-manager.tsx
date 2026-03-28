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
  const activeCount = sortedVideos.filter((video) => video.isActive).length;

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
      onStatus(`랜딩 영상을 추가했습니다: ${data.video.youtubeId}`);
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
    setVideos((prev) =>
      prev.map((video) => (video.id === id ? { ...video, [key]: value } : video)),
    );
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
      setVideos((prev) =>
        sortVideos(prev.map((item) => (item.id === video.id ? data.video : item))),
      );
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
    <section className="admin-panel relative overflow-hidden rounded-[24px] p-5 md:p-6">
      <div className="flex flex-col gap-5 border-b pb-5" style={{ borderColor: "var(--hub-border)" }}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              랜딩 스트림
            </p>
            <h2
              className="mt-2 text-2xl font-black uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-text)" }}
            >
              랜딩 영상 관리
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>
              메인 랜딩에서 순환 재생하는 배경 영상을 정렬하고, 실제 노출 여부를 조정하는 구역입니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                borderColor: "var(--hub-outline)",
                backgroundColor: "var(--hub-accent-soft)",
                color: "var(--hub-accent)",
              }}
            >
              활성 {activeCount}
            </span>
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
            >
              전체 {sortedVideos.length}
            </span>
          </div>
        </div>

        <form
          onSubmit={createVideo}
          className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_120px_auto_auto]"
        >
          <input
            value={newVideo.title}
            onChange={(event) => setNewVideo((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="영상 제목"
            className="rounded-2xl px-3 py-3 text-sm outline-none"
          />
          <input
            value={newVideo.youtubeId}
            onChange={(event) =>
              setNewVideo((prev) => ({ ...prev, youtubeId: event.target.value.trim() }))
            }
            placeholder="YouTube URL 또는 ID"
            required
            className="rounded-2xl px-3 py-3 text-sm outline-none"
          />
          <input
            type="number"
            value={newVideo.order}
            onChange={(event) => setNewVideo((prev) => ({ ...prev, order: event.target.value }))}
            className="rounded-2xl px-3 py-3 text-sm outline-none"
            aria-label="정렬 순서"
          />
          <label
            className="inline-flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold"
            style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
          >
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
            className="admin-link-chip h-fit disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? "추가 중" : "영상 추가"}
          </button>
        </form>
      </div>

      <div className="mt-5 space-y-4">
        {sortedVideos.length === 0 ? (
          <p
            className="rounded-2xl border px-4 py-4 text-sm"
            style={{
              borderColor: "var(--hub-border)",
              backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 76%, transparent)",
              color: "var(--hub-muted)",
            }}
          >
            등록된 랜딩 영상이 없습니다.
          </p>
        ) : (
          sortedVideos.map((video) => (
            <article
              key={video.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--hub-border)",
                backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 72%, transparent)",
              }}
            >
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div>
                  <div
                    className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: "var(--hub-border)" }}
                  >
                    <iframe
                      className="h-44 w-full"
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
                    className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--hub-accent)" }}
                  >
                    YouTube에서 보기
                  </a>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--hub-muted)" }}
                    >
                      제목
                    </span>
                    <input
                      value={video.title ?? ""}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "title", event.target.value || null)
                      }
                      className="rounded-2xl px-3 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--hub-muted)" }}
                    >
                      YouTube ID
                    </span>
                    <input
                      value={video.youtubeId}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "youtubeId", event.target.value.trim())
                      }
                      className="rounded-2xl px-3 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--hub-muted)" }}
                    >
                      순서
                    </span>
                    <input
                      type="number"
                      value={video.order}
                      onChange={(event) =>
                        updateLocalVideo(video.id, "order", Number(event.target.value))
                      }
                      className="rounded-2xl px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <div
                    className="flex flex-col justify-between gap-3 rounded-2xl border p-3"
                    style={{ borderColor: "var(--hub-border)" }}
                  >
                    <label
                      className="inline-flex items-center gap-2 text-xs font-semibold"
                      style={{ color: "var(--hub-muted)" }}
                    >
                      <input
                        type="checkbox"
                        checked={video.isActive}
                        onChange={(event) =>
                          updateLocalVideo(video.id, "isActive", event.target.checked)
                        }
                      />
                      활성 상태 유지
                    </label>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--hub-muted)" }}>
                      최근 수정: {toDateString(video.updatedAt)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingId === video.id}
                        onClick={() => saveVideo(video)}
                        className="rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "var(--hub-outline)", color: "var(--hub-accent)" }}
                      >
                        {savingId === video.id ? "저장 중" : "저장"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === video.id}
                        onClick={() => removeVideo(video)}
                        className="rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-60"
                        style={{
                          borderColor: "var(--hub-danger-border)",
                          color: "var(--hub-danger-text)",
                        }}
                      >
                        {deletingId === video.id ? "삭제 중" : "삭제"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
