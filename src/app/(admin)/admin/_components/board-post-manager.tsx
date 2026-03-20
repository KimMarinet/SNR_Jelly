"use client";

import { FormEvent, useMemo, useState } from "react";
import { readJson } from "./http";
import type { AdminBoard, AdminPost } from "./types";

type PostScope = "active" | "trash";

type PostPanelState = {
  scope: PostScope;
  posts: AdminPost[];
  loading: boolean;
  error: string | null;
};

type BoardPostManagerProps = {
  initialActiveBoards: AdminBoard[];
  initialInactiveBoards: AdminBoard[];
  onStatus: (message: string) => void;
};

export function BoardPostManager({
  initialActiveBoards,
  initialInactiveBoards,
  onStatus,
}: BoardPostManagerProps) {
  const [activeBoards, setActiveBoards] = useState(initialActiveBoards);
  const [inactiveBoards, setInactiveBoards] = useState(initialInactiveBoards);
  const [newBoard, setNewBoard] = useState({
    title: "",
    slug: "",
    description: "",
    order: "0",
  });
  const [creating, setCreating] = useState(false);
  const [savingBoardId, setSavingBoardId] = useState<number | null>(null);
  const [mutatingBoardId, setMutatingBoardId] = useState<number | null>(null);
  const [postPanels, setPostPanels] = useState<Record<number, PostPanelState>>({});
  const [boardTab, setBoardTab] = useState<"active" | "inactive">("active");

  const sortedActiveBoards = useMemo(
    () => [...activeBoards].sort((a, b) => a.order - b.order || a.id - b.id),
    [activeBoards],
  );
  const sortedInactiveBoards = useMemo(
    () => [...inactiveBoards].sort((a, b) => a.order - b.order || a.id - b.id),
    [inactiveBoards],
  );

  function upsertBoard(list: AdminBoard[], board: AdminBoard): AdminBoard[] {
    const replaced = list.map((item) => (item.id === board.id ? board : item));
    return replaced.some((item) => item.id === board.id) ? replaced : [board, ...list];
  }

  function editBoard(
    boardId: number,
    key: keyof Pick<AdminBoard, "title" | "slug" | "description" | "order">,
    value: string | number | null,
    active: boolean,
  ) {
    const setBoards = active ? setActiveBoards : setInactiveBoards;
    setBoards((prev) =>
      prev.map((board) => (board.id === boardId ? { ...board, [key]: value } : board)),
    );
  }

  async function refreshBoards() {
    const [activeRes, inactiveRes] = await Promise.all([
      fetch("/api/admin/boards?status=active", { cache: "no-store" }),
      fetch("/api/admin/boards?status=inactive", { cache: "no-store" }),
    ]);
    const [activeData, inactiveData] = await Promise.all([
      readJson<{ boards: AdminBoard[] }>(activeRes),
      readJson<{ boards: AdminBoard[] }>(inactiveRes),
    ]);

    setActiveBoards(activeData.boards);
    setInactiveBoards(inactiveData.boards);
  }

  async function createBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    onStatus("");

    try {
      const response = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBoard.title,
          slug: newBoard.slug,
          description: newBoard.description,
          order: Number(newBoard.order),
        }),
      });
      const data = await readJson<{ board: AdminBoard }>(response);
      setActiveBoards((prev) => upsertBoard(prev, data.board));
      setNewBoard({ title: "", slug: "", description: "", order: "0" });
      onStatus(`게시판 생성 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "게시판 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function saveBoard(board: AdminBoard, active: boolean) {
    setSavingBoardId(board.id);
    onStatus("");
    try {
      const response = await fetch(`/api/admin/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: board.title,
          slug: board.slug,
          description: board.description,
          order: board.order,
        }),
      });
      const data = await readJson<{ board: AdminBoard }>(response);
      if (active) {
        setActiveBoards((prev) => upsertBoard(prev, data.board));
      } else {
        setInactiveBoards((prev) => upsertBoard(prev, data.board));
      }
      onStatus(`게시판 저장 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "게시판 저장에 실패했습니다.");
    } finally {
      setSavingBoardId(null);
    }
  }

  async function deactivateBoard(boardId: number) {
    setMutatingBoardId(boardId);
    onStatus("");
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      const data = await readJson<{ board: AdminBoard }>(response);
      setActiveBoards((prev) => prev.filter((board) => board.id !== boardId));
      setInactiveBoards((prev) => upsertBoard(prev, data.board));
      onStatus(`게시판 비활성화 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "비활성화에 실패했습니다.");
    } finally {
      setMutatingBoardId(null);
    }
  }

  async function restoreBoard(boardId: number) {
    setMutatingBoardId(boardId);
    onStatus("");
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await readJson<{ board: AdminBoard }>(response);
      setInactiveBoards((prev) => prev.filter((board) => board.id !== boardId));
      setActiveBoards((prev) => upsertBoard(prev, data.board));
      onStatus(`게시판 복구 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "복구에 실패했습니다.");
    } finally {
      setMutatingBoardId(null);
    }
  }

  async function hardDeleteBoard(board: AdminBoard) {
    if (!window.confirm(`"${board.title}" 게시판을 영구 삭제하시겠습니까?`)) {
      return;
    }
    const confirmBoardTitle = window.prompt(
      `최종 삭제를 위해 게시판 이름을 정확히 입력해 주세요: ${board.title}`,
    );
    if (confirmBoardTitle === null) {
      return;
    }

    setMutatingBoardId(board.id);
    onStatus("");

    try {
      const response = await fetch(`/api/admin/boards/${board.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmBoardTitle }),
      });
      await readJson(response);
      setInactiveBoards((prev) => prev.filter((item) => item.id !== board.id));
      onStatus(`게시판 영구 삭제 완료: ${board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "영구 삭제에 실패했습니다.");
    } finally {
      setMutatingBoardId(null);
    }
  }

  async function loadPosts(boardId: number, scope: PostScope) {
    setPostPanels((prev) => ({
      ...prev,
      [boardId]: {
        scope,
        posts: prev[boardId]?.posts ?? [],
        loading: true,
        error: null,
      },
    }));

    try {
      const response = await fetch(`/api/admin/posts?boardId=${boardId}&scope=${scope}`);
      const data = await readJson<{ posts: AdminPost[] }>(response);
      setPostPanels((prev) => ({
        ...prev,
        [boardId]: { scope, posts: data.posts, loading: false, error: null },
      }));
    } catch (caught) {
      setPostPanels((prev) => ({
        ...prev,
        [boardId]: {
          scope,
          posts: prev[boardId]?.posts ?? [],
          loading: false,
          error: caught instanceof Error ? caught.message : "게시글 불러오기에 실패했습니다.",
        },
      }));
    }
  }

  async function mutatePost(
    boardId: number,
    postId: number,
    action:
      | { method: "PATCH"; body: { action: "toggle-publish"; isPublished: boolean } }
      | { method: "PATCH"; body: { action: "trash" | "restore" } }
      | { method: "DELETE" },
  ) {
    const scope = postPanels[boardId]?.scope ?? "active";
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.method === "DELETE" ? undefined : JSON.stringify(action.body),
      });
      await readJson(response);
      await loadPosts(boardId, scope);
      await refreshBoards();
      onStatus("게시글 변경이 반영되었습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "게시글 변경에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 섹션 A : 게시판 생성 ── */}
      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 border-b border-emerald-400/15 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15 text-sm text-emerald-300">
            ＋
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              New Board
            </p>
            <h2 className="text-sm font-semibold text-white">게시판 생성</h2>
          </div>
        </div>

        {/* 생성 폼 */}
        <form onSubmit={createBoard} className="grid gap-3 px-6 py-5 md:grid-cols-4">
          <input
            value={newBoard.title}
            onChange={(e) => setNewBoard((p) => ({ ...p, title: e.target.value }))}
            placeholder="게시판 이름"
            required
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <input
            value={newBoard.slug}
            onChange={(e) => setNewBoard((p) => ({ ...p, slug: e.target.value.trim().toLowerCase() }))}
            placeholder="슬러그"
            required
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <input
            value={newBoard.description}
            onChange={(e) => setNewBoard((p) => ({ ...p, description: e.target.value }))}
            placeholder="설명 (선택)"
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newBoard.order}
              onChange={(e) => setNewBoard((p) => ({ ...p, order: e.target.value }))}
              className="w-24 rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
            />
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "생성 중..." : "게시판 생성"}
            </button>
          </div>
        </form>
      </section>

      {/* ── 섹션 B : 게시판 관리 ── */}
      <section className="rounded-2xl border border-white/10 bg-black/25">
        {/* 섹션 헤더 + 탭 바 */}
        <div className="flex flex-col gap-0 border-b border-white/10">
          {/* 섹션 타이틀 */}
          <div className="flex items-center gap-3 px-6 pt-4 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-sm text-slate-300">
              ☰
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Board Management
              </p>
              <h2 className="text-sm font-semibold text-white">게시판 관리</h2>
            </div>
          </div>

          {/* 탭 목록 */}
          <div className="flex px-6">
            <button
              type="button"
              onClick={() => setBoardTab("active")}
              className={[
                "relative flex items-center gap-2 pb-2.5 pt-1 text-sm font-semibold transition-colors",
                "mr-6",
                boardTab === "active"
                  ? "text-emerald-300"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  boardTab === "active" ? "bg-emerald-400" : "bg-slate-600",
                ].join(" ")}
              />
              활성 게시판
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  boardTab === "active"
                    ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-white/10 text-slate-400",
                ].join(" ")}
              >
                {sortedActiveBoards.length}
              </span>
              {/* 활성 탭 언더라인 */}
              {boardTab === "active" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setBoardTab("inactive")}
              className={[
                "relative flex items-center gap-2 pb-2.5 pt-1 text-sm font-semibold transition-colors",
                boardTab === "inactive"
                  ? "text-amber-300"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  boardTab === "inactive" ? "bg-amber-400" : "bg-slate-600",
                ].join(" ")}
              />
              비활성 게시판
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  boardTab === "inactive"
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-white/10 text-slate-400",
                ].join(" ")}
              >
                {sortedInactiveBoards.length}
              </span>
              {/* 활성 탭 언더라인 */}
              {boardTab === "inactive" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-6 py-5">
          {boardTab === "active" ? (
            <BoardColumn
              label={`활성 게시판 (${sortedActiveBoards.length})`}
              tone="active"
              boards={sortedActiveBoards}
              savingBoardId={savingBoardId}
              mutatingBoardId={mutatingBoardId}
              postPanels={postPanels}
              onEdit={(id, key, value) => editBoard(id, key, value, true)}
              onSave={(board) => saveBoard(board, true)}
              onDeactivate={deactivateBoard}
              onLoadPosts={loadPosts}
              onTogglePostPublish={(boardId, post) =>
                mutatePost(boardId, post.id, {
                  method: "PATCH",
                  body: { action: "toggle-publish", isPublished: !post.isPublished },
                })
              }
              onTrashPost={(boardId, post) =>
                mutatePost(boardId, post.id, { method: "PATCH", body: { action: "trash" } })
              }
              onRestorePost={(boardId, post) =>
                mutatePost(boardId, post.id, { method: "PATCH", body: { action: "restore" } })
              }
              onDeletePost={(boardId, post) => mutatePost(boardId, post.id, { method: "DELETE" })}
            />
          ) : (
            <BoardColumn
              label={`비활성 게시판 (${sortedInactiveBoards.length})`}
              tone="inactive"
              boards={sortedInactiveBoards}
              savingBoardId={savingBoardId}
              mutatingBoardId={mutatingBoardId}
              postPanels={postPanels}
              onEdit={(id, key, value) => editBoard(id, key, value, false)}
              onSave={(board) => saveBoard(board, false)}
              onRestore={restoreBoard}
              onHardDelete={hardDeleteBoard}
              onLoadPosts={loadPosts}
              onTogglePostPublish={(boardId, post) =>
                mutatePost(boardId, post.id, {
                  method: "PATCH",
                  body: { action: "toggle-publish", isPublished: !post.isPublished },
                })
              }
              onTrashPost={(boardId, post) =>
                mutatePost(boardId, post.id, { method: "PATCH", body: { action: "trash" } })
              }
              onRestorePost={(boardId, post) =>
                mutatePost(boardId, post.id, { method: "PATCH", body: { action: "restore" } })
              }
              onDeletePost={(boardId, post) => mutatePost(boardId, post.id, { method: "DELETE" })}
            />
          )}
        </div>
      </section>
    </div>
  );
}

type BoardColumnProps = {
  label?: string; // 탭 전환 방식 도입 후 헤더 표시 불필요 (하위 호환 유지)
  tone: "active" | "inactive";
  boards: AdminBoard[];
  savingBoardId: number | null;
  mutatingBoardId: number | null;
  postPanels: Record<number, PostPanelState>;
  onEdit: (
    boardId: number,
    key: keyof Pick<AdminBoard, "title" | "slug" | "description" | "order">,
    value: string | number | null,
  ) => void;
  onSave: (board: AdminBoard) => void;
  onDeactivate?: (boardId: number) => void;
  onRestore?: (boardId: number) => void;
  onHardDelete?: (board: AdminBoard) => void;
  onLoadPosts: (boardId: number, scope: PostScope) => void;
  onTogglePostPublish: (boardId: number, post: AdminPost) => void;
  onTrashPost: (boardId: number, post: AdminPost) => void;
  onRestorePost: (boardId: number, post: AdminPost) => void;
  onDeletePost: (boardId: number, post: AdminPost) => void;
};

function BoardColumn({
  label,
  tone,
  boards,
  savingBoardId,
  mutatingBoardId,
  postPanels,
  onEdit,
  onSave,
  onDeactivate,
  onRestore,
  onHardDelete,
  onLoadPosts,
  onTogglePostPublish,
  onTrashPost,
  onRestorePost,
  onDeletePost,
}: BoardColumnProps) {
  return (
    <div className="space-y-3">
      {boards.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-zinc-500">
          게시판이 없습니다.
        </p>
      ) : null}
      {boards.map((board) => {
        const panel = postPanels[board.id];
        const posts = panel?.posts ?? [];
        const scope = panel?.scope ?? "active";

        return (
          <article key={board.id} className="overflow-hidden rounded-xl border border-white/15 bg-black/35">
            {/* ── 카드 헤더: 게시판 식별 정보 ── */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  #{board.id}
                </span>
                <p className="text-sm font-semibold text-white">{board.title}</p>
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-slate-400">
                  /{board.slug}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                게시글 {board._count?.posts ?? 0}개
              </span>
            </div>

            {/* ── 필드 편집 그리드 ── */}
            <div className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
              {/* 이름 */}
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  이름
                </span>
                <input
                  value={board.title}
                  onChange={(e) => onEdit(board.id, "title", e.target.value)}
                  className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
                />
              </label>

              {/* 슬러그 */}
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  슬러그 (URL 경로)
                </span>
                <input
                  value={board.slug}
                  onChange={(e) => onEdit(board.id, "slug", e.target.value.trim().toLowerCase())}
                  className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 font-mono text-sm text-white outline-none focus:border-white/40"
                />
              </label>

              {/* 설명 */}
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  설명
                </span>
                <input
                  value={board.description ?? ""}
                  onChange={(e) => onEdit(board.id, "description", e.target.value)}
                  placeholder="(없음)"
                  className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40 placeholder:text-slate-600"
                />
              </label>

              {/* 표시 순서 */}
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  표시 순서
                </span>
                <input
                  type="number"
                  value={board.order}
                  onChange={(e) => onEdit(board.id, "order", Number(e.target.value))}
                  className="w-28 rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
                />
              </label>
            </div>

            {/* ── 액션 버튼 ── */}
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/20 px-4 py-3">
              <button
                type="button"
                disabled={savingBoardId === board.id}
                onClick={() => onSave(board)}
                className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-60"
              >
                {savingBoardId === board.id ? "저장 중..." : "저장"}
              </button>

              {tone === "active" ? (
                <button
                  type="button"
                  disabled={mutatingBoardId === board.id}
                  onClick={() => onDeactivate?.(board.id)}
                  className="rounded-full border border-amber-300/50 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-60"
                >
                  {mutatingBoardId === board.id ? "처리 중..." : "비활성화"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={mutatingBoardId === board.id}
                    onClick={() => onRestore?.(board.id)}
                    className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-60"
                  >
                    {mutatingBoardId === board.id ? "처리 중..." : "복구"}
                  </button>
                  <button
                    type="button"
                    disabled={mutatingBoardId === board.id}
                    onClick={() => onHardDelete?.(board)}
                    className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60"
                  >
                    {mutatingBoardId === board.id ? "처리 중..." : "최종 삭제"}
                  </button>
                </>
              )}
            </div>

            {/* ── 게시글 관리 ── */}
            <details className="border-t border-white/10">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
                <span>게시글 관리</span>
                <span className="select-none text-slate-600">▾</span>
              </summary>

              <div className="space-y-2 border-t border-white/8 px-4 py-3">
                {/* 게시글 범위 탭 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadPosts(board.id, "active")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      scope === "active"
                        ? "bg-emerald-300 text-zinc-950"
                        : "border border-white/25 text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    활성
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadPosts(board.id, "trash")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      scope === "trash"
                        ? "bg-amber-300 text-zinc-950"
                        : "border border-white/25 text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    휴지통
                  </button>
                </div>

                {panel?.loading && (
                  <p className="text-xs text-slate-500">불러오는 중...</p>
                )}
                {panel?.error && (
                  <p className="text-xs text-rose-300">{panel.error}</p>
                )}
                {!panel?.loading && posts.length === 0 && (
                  <p className="text-xs text-slate-600">게시글이 없습니다.</p>
                )}

                {/* 게시글 목록 */}
                {posts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{post.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{post.author.email}</p>
                      </div>
                      {!post.deletedAt && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            post.isPublished
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-white/8 text-slate-500"
                          }`}
                        >
                          {post.isPublished ? "공개" : "비공개"}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {!post.deletedAt ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onTogglePostPublish(board.id, post)}
                            className="rounded-full border border-cyan-300/50 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
                          >
                            {post.isPublished ? "비공개 전환" : "공개 전환"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onTrashPost(board.id, post)}
                            className="rounded-full border border-amber-300/50 px-2 py-0.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-400/10"
                          >
                            휴지통 이동
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onRestorePost(board.id, post)}
                            className="rounded-full border border-emerald-300/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
                          >
                            복구
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePost(board.id, post)}
                            className="rounded-full border border-rose-300/50 px-2 py-0.5 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-400/10"
                          >
                            영구 삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}
