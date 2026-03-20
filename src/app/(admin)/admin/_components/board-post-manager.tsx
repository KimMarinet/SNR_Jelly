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
    <section className="rounded-2xl border border-white/15 bg-black/30 p-5">
      <h2 className="text-lg font-semibold text-white">게시판 / 게시글 관리</h2>

      <form onSubmit={createBoard} className="mt-4 grid gap-3 md:grid-cols-4">
        <input value={newBoard.title} onChange={(e) => setNewBoard((p) => ({ ...p, title: e.target.value }))} placeholder="게시판 이름" required className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
        <input value={newBoard.slug} onChange={(e) => setNewBoard((p) => ({ ...p, slug: e.target.value.trim().toLowerCase() }))} placeholder="슬러그" required className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
        <input value={newBoard.description} onChange={(e) => setNewBoard((p) => ({ ...p, description: e.target.value }))} placeholder="설명 (선택)" className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
        <div className="flex gap-2">
          <input type="number" value={newBoard.order} onChange={(e) => setNewBoard((p) => ({ ...p, order: e.target.value }))} className="w-24 rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
          <button type="submit" disabled={creating} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70">{creating ? "생성 중..." : "게시판 생성"}</button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
      </div>
    </section>
  );
}

type BoardColumnProps = {
  label: string;
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
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${tone === "active" ? "text-emerald-200" : "text-amber-200"}`}>{label}</h3>
      {boards.length === 0 ? <p className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-zinc-300">게시판이 없습니다.</p> : null}
      {boards.map((board) => {
        const panel = postPanels[board.id];
        const posts = panel?.posts ?? [];
        const scope = panel?.scope ?? "active";

        return (
          <article key={board.id} className="rounded-xl border border-white/15 bg-black/35 p-4">
            <div className="grid gap-2">
              <input value={board.title} onChange={(e) => onEdit(board.id, "title", e.target.value)} className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none" />
              <input value={board.slug} onChange={(e) => onEdit(board.id, "slug", e.target.value.trim().toLowerCase())} className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none" />
              <input value={board.description ?? ""} onChange={(e) => onEdit(board.id, "description", e.target.value)} className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none" />
              <input type="number" value={board.order} onChange={(e) => onEdit(board.id, "order", Number(e.target.value))} className="w-24 rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span>게시글: {board._count?.posts ?? 0}</span>
              <button type="button" disabled={savingBoardId === board.id} onClick={() => onSave(board)} className="rounded-full border border-emerald-300/50 px-3 py-1 font-semibold text-emerald-100 disabled:opacity-70">{savingBoardId === board.id ? "저장 중..." : "저장"}</button>
              {tone === "active" ? (
                <button type="button" disabled={mutatingBoardId === board.id} onClick={() => onDeactivate?.(board.id)} className="rounded-full border border-amber-300/50 px-3 py-1 font-semibold text-amber-100 disabled:opacity-70">{mutatingBoardId === board.id ? "처리 중..." : "비활성화"}</button>
              ) : (
                <>
                  <button type="button" disabled={mutatingBoardId === board.id} onClick={() => onRestore?.(board.id)} className="rounded-full border border-emerald-300/50 px-3 py-1 font-semibold text-emerald-100 disabled:opacity-70">{mutatingBoardId === board.id ? "처리 중..." : "복구"}</button>
                  <button type="button" disabled={mutatingBoardId === board.id} onClick={() => onHardDelete?.(board)} className="rounded-full border border-rose-300/50 px-3 py-1 font-semibold text-rose-100 disabled:opacity-70">{mutatingBoardId === board.id ? "처리 중..." : "최종 삭제"}</button>
                </>
              )}
            </div>

            <details className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-white">게시글 관리</summary>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => onLoadPosts(board.id, "active")} className={`rounded-full px-3 py-1 text-xs font-semibold ${scope === "active" ? "bg-emerald-300 text-zinc-950" : "border border-white/25 text-zinc-100"}`}>활성</button>
                  <button type="button" onClick={() => onLoadPosts(board.id, "trash")} className={`rounded-full px-3 py-1 text-xs font-semibold ${scope === "trash" ? "bg-amber-300 text-zinc-950" : "border border-white/25 text-zinc-100"}`}>휴지통</button>
                </div>
                {panel?.loading ? <p className="text-xs text-zinc-300">불러오는 중...</p> : null}
                {panel?.error ? <p className="text-xs text-rose-200">{panel.error}</p> : null}
                {!panel?.loading && posts.length === 0 ? <p className="text-xs text-zinc-300">게시글이 없습니다.</p> : null}
                {posts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <p className="text-sm font-semibold text-white">{post.title}</p>
                    <p className="text-xs text-zinc-300">{post.author.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {!post.deletedAt ? (
                        <>
                          <button type="button" onClick={() => onTogglePostPublish(board.id, post)} className="rounded-full border border-cyan-300/50 px-2 py-1 text-[11px] font-semibold text-cyan-100">{post.isPublished ? "비공개 전환" : "공개 전환"}</button>
                          <button type="button" onClick={() => onTrashPost(board.id, post)} className="rounded-full border border-amber-300/50 px-2 py-1 text-[11px] font-semibold text-amber-100">휴지통 이동</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => onRestorePost(board.id, post)} className="rounded-full border border-emerald-300/50 px-2 py-1 text-[11px] font-semibold text-emerald-100">복구</button>
                          <button type="button" onClick={() => onDeletePost(board.id, post)} className="rounded-full border border-rose-300/50 px-2 py-1 text-[11px] font-semibold text-rose-100">영구 삭제</button>
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
