"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PaginationControls } from "@/components/pagination/pagination";
import { readJson } from "./http";
import type { AdminBoard, AdminPost } from "./types";
import { buildPaginationState } from "@/lib/pagination";

type PostScope = "active" | "trash";

type PostPanelState = {
  scope: PostScope;
  posts: AdminPost[];
  loading: boolean;
  error: string | null;
};

type BulkPostAction =
  | "publish"
  | "unpublish"
  | "pin"
  | "unpin"
  | "trash"
  | "restore"
  | "delete";

type ConfirmModal =
  | { type: "deactivate"; boardId: number; boardTitle: string }
  | { type: "hard-delete"; board: AdminBoard; inputValue: string }
  | null;

type BoardPostManagerProps = {
  initialActiveBoards: AdminBoard[];
  initialInactiveBoards: AdminBoard[];
  onStatus: (message: string) => void;
};

type BoardTab = "active" | "inactive";

type SelectedBoardByTab = {
  active: number | null;
  inactive: number | null;
};

const BOARD_LIST_PAGE_SIZE = 3;
const BOARD_LIST_WINDOW_SIZE = 5;
const POST_PAGE_SIZE = 6;
const POST_PAGE_WINDOW_SIZE = 10;

type PostManagerModalProps = {
  board: AdminBoard;
  panel: PostPanelState | undefined;
  bulkMutatingKey: string | null;
  onClose: () => void;
  onRefreshPosts: (boardId: number, scope: PostScope) => void;
  onBulkAction: (
    boardId: number,
    scope: PostScope,
    postIds: number[],
    action: BulkPostAction,
  ) => Promise<void>;
  onTogglePublish: (boardId: number, post: AdminPost) => void;
  onTogglePin: (boardId: number, post: AdminPost) => void;
  onTrashPost: (boardId: number, post: AdminPost) => void;
  onRestorePost: (boardId: number, post: AdminPost) => void;
  onDeletePost: (boardId: number, post: AdminPost) => void;
};

function upsertBoard(list: AdminBoard[], board: AdminBoard): AdminBoard[] {
  const replaced = list.map((item) => (item.id === board.id ? board : item));
  return replaced.some((item) => item.id === board.id) ? replaced : [board, ...list];
}

function extractFirstImageUrl(content: string): string | null {
  const htmlImgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImgMatch?.[1]) {
    return htmlImgMatch[1];
  }

  const markdownImgMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownImgMatch?.[1]) {
    return markdownImgMatch[1];
  }

  return null;
}

function toPreviewText(content: string, max = 100): string {
  const withoutTags = content
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[[^\]]+]\(([^)]+)\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!withoutTags) {
    return "본문 미리보기가 없습니다.";
  }

  return withoutTags.length > max ? `${withoutTags.slice(0, max)}...` : withoutTags;
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function isHardDeleteLocked(board: AdminBoard): boolean {
  return board.isSystemProtected;
}

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
    isAdminWriteOnly: false,
  });
  const [creating, setCreating] = useState(false);
  const [savingBoardId, setSavingBoardId] = useState<number | null>(null);
  const [mutatingBoardId, setMutatingBoardId] = useState<number | null>(null);
  const [bulkMutatingKey, setBulkMutatingKey] = useState<string | null>(null);
  const [postPanels, setPostPanels] = useState<Record<number, PostPanelState>>({});
  const [boardTab, setBoardTab] = useState<BoardTab>("active");
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [boardListPageByTab, setBoardListPageByTab] = useState<Record<BoardTab, number>>({
    active: 1,
    inactive: 1,
  });
  const [selectedBoardByTab, setSelectedBoardByTab] = useState<SelectedBoardByTab>({
    active: initialActiveBoards[0]?.id ?? null,
    inactive: initialInactiveBoards[0]?.id ?? null,
  });
  const [postManagerBoardId, setPostManagerBoardId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);

  const sortedActiveBoards = useMemo(
    () => [...activeBoards].sort((a, b) => a.order - b.order || a.id - b.id),
    [activeBoards],
  );
  const sortedInactiveBoards = useMemo(
    () => [...inactiveBoards].sort((a, b) => a.order - b.order || a.id - b.id),
    [inactiveBoards],
  );
  const allBoards = useMemo(
    () => [...sortedActiveBoards, ...sortedInactiveBoards],
    [sortedActiveBoards, sortedInactiveBoards],
  );

  const currentBoards = boardTab === "active" ? sortedActiveBoards : sortedInactiveBoards;
  const normalizedBoardSearchQuery = boardSearchQuery.trim().toLowerCase();
  const filteredBoards = useMemo(() => {
    if (!normalizedBoardSearchQuery) {
      return currentBoards;
    }
    return currentBoards.filter((board) => {
      const title = board.title.toLowerCase();
      const slug = board.slug.toLowerCase();
      const description = (board.description ?? "").toLowerCase();
      return (
        title.includes(normalizedBoardSearchQuery) ||
        slug.includes(normalizedBoardSearchQuery) ||
        description.includes(normalizedBoardSearchQuery)
      );
    });
  }, [currentBoards, normalizedBoardSearchQuery]);
  const requestedBoardListPage = boardListPageByTab[boardTab];
  const boardListPagination = buildPaginationState({
    currentPage: requestedBoardListPage,
    totalItems: filteredBoards.length,
    itemsPerPage: BOARD_LIST_PAGE_SIZE,
    windowSize: BOARD_LIST_WINDOW_SIZE,
  });
  const currentBoardListPage = boardListPagination.currentPage;
  const boardListTotalPages = boardListPagination.totalPages;
  const boardListPageNumbers = boardListPagination.pageNumbers;
  const visibleBoards = filteredBoards.slice(
    (boardListPagination.currentPage - 1) * BOARD_LIST_PAGE_SIZE,
    boardListPagination.currentPage * BOARD_LIST_PAGE_SIZE,
  );
  const boardListSlots = Array.from(
    { length: BOARD_LIST_PAGE_SIZE },
    (_, index) => visibleBoards[index] ?? null,
  );
  const selectedBoard = useMemo(() => {
    const selectedId = selectedBoardByTab[boardTab];
    return currentBoards.find((board) => board.id === selectedId) ?? currentBoards[0] ?? null;
  }, [boardTab, currentBoards, selectedBoardByTab]);
  const postManagerBoard =
    allBoards.find((board) => board.id === postManagerBoardId) ?? null;

  useEffect(() => {
    setSelectedBoardByTab((prev) => {
      const next: SelectedBoardByTab = { ...prev };
      let changed = false;

      if (!sortedActiveBoards.some((board) => board.id === next.active)) {
        next.active = sortedActiveBoards[0]?.id ?? null;
        changed = true;
      }

      if (!sortedInactiveBoards.some((board) => board.id === next.inactive)) {
        next.inactive = sortedInactiveBoards[0]?.id ?? null;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [sortedActiveBoards, sortedInactiveBoards]);

  useEffect(() => {
    setBoardListPageByTab((prev) => {
      const activeTotalPages = buildPaginationState({
        currentPage: prev.active ?? 1,
        totalItems: sortedActiveBoards.length,
        itemsPerPage: BOARD_LIST_PAGE_SIZE,
        windowSize: BOARD_LIST_WINDOW_SIZE,
      }).totalPages;
      const inactiveTotalPages = buildPaginationState({
        currentPage: prev.inactive ?? 1,
        totalItems: sortedInactiveBoards.length,
        itemsPerPage: BOARD_LIST_PAGE_SIZE,
        windowSize: BOARD_LIST_WINDOW_SIZE,
      }).totalPages;

      const nextActive = Math.min(prev.active, activeTotalPages);
      const nextInactive = Math.min(prev.inactive, inactiveTotalPages);

      if (nextActive === prev.active && nextInactive === prev.inactive) {
        return prev;
      }

      return {
        active: nextActive,
        inactive: nextInactive,
      };
    });
  }, [sortedActiveBoards.length, sortedInactiveBoards.length]);

  useEffect(() => {
    setBoardListPageByTab((prev) => {
      if (prev[boardTab] <= boardListPagination.totalPages) {
        return prev;
      }
      return { ...prev, [boardTab]: boardListPagination.totalPages };
    });
  }, [boardListPagination.totalPages, boardTab]);

  useEffect(() => {
    setBoardListPageByTab((prev) => ({ ...prev, [boardTab]: 1 }));
  }, [boardSearchQuery, boardTab]);

  useEffect(() => {
    const selectedId = selectedBoardByTab[boardTab];
    if (selectedId !== null && filteredBoards.some((board) => board.id === selectedId)) {
      return;
    }
    const firstBoardId = filteredBoards[0]?.id ?? null;
    if (firstBoardId === null) {
      return;
    }
    setSelectedBoardByTab((prev) => ({ ...prev, [boardTab]: firstBoardId }));
  }, [boardTab, filteredBoards, selectedBoardByTab]);

  useEffect(() => {
    if (postManagerBoardId === null) {
      return;
    }
    if (!allBoards.some((board) => board.id === postManagerBoardId)) {
      setPostManagerBoardId(null);
    }
  }, [allBoards, postManagerBoardId]);

  function selectBoard(tab: BoardTab, boardId: number) {
    setBoardTab(tab);
    setSelectedBoardByTab((prev) => ({ ...prev, [tab]: boardId }));
  }

  function editBoard(
    boardId: number,
    key: keyof Pick<
      AdminBoard,
      "title" | "slug" | "description" | "order" | "isAdminWriteOnly"
    >,
    value: string | number | boolean | null,
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
          isAdminWriteOnly: newBoard.isAdminWriteOnly,
        }),
      });
      const data = await readJson<{ board: AdminBoard }>(response);
      setActiveBoards((prev) => upsertBoard(prev, data.board));
      setSelectedBoardByTab((prev) => ({ ...prev, active: data.board.id }));
      setBoardTab("active");
      setNewBoard({
        title: "",
        slug: "",
        description: "",
        order: "0",
        isAdminWriteOnly: false,
      });
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
          isAdminWriteOnly: board.isAdminWriteOnly,
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

  function deactivateBoard(board: AdminBoard) {
    setConfirmModal({ type: "deactivate", boardId: board.id, boardTitle: board.title });
  }

  async function executeDeactivate(boardId: number) {
    setConfirmModal(null);
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
      setBoardTab("inactive");
      setSelectedBoardByTab((prev) => ({ ...prev, inactive: data.board.id }));
      onStatus(`게시판 비활성화 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "게시판 비활성화에 실패했습니다.");
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
      setBoardTab("active");
      setSelectedBoardByTab((prev) => ({ ...prev, active: data.board.id }));
      onStatus(`게시판 복구 완료: ${data.board.title}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "게시판 복구에 실패했습니다.");
    } finally {
      setMutatingBoardId(null);
    }
  }

  function hardDeleteBoard(board: AdminBoard) {
    if (isHardDeleteLocked(board)) {
      onStatus("공지 사항과 전략글 게시판은 시스템 보호 게시판이라 삭제할 수 없습니다.");
      return;
    }

    setConfirmModal({ type: "hard-delete", board, inputValue: "" });
  }

  async function executeHardDelete(board: AdminBoard, confirmBoardTitle: string) {
    setConfirmModal(null);
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
      onStatus(caught instanceof Error ? caught.message : "게시판 영구 삭제에 실패했습니다.");
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
        [boardId]: {
          scope,
          posts: data.posts,
          loading: false,
          error: null,
        },
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
      | { method: "PATCH"; body: { action: "toggle-pin"; isPinned: boolean } }
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

  function createBulkRequest(action: BulkPostAction, postId: number) {
    if (action === "delete") {
      return {
        endpoint: `/api/admin/posts/${postId}`,
        init: { method: "DELETE" as const },
      };
    }

    if (action === "publish" || action === "unpublish") {
      return {
        endpoint: `/api/admin/posts/${postId}`,
        init: {
          method: "PATCH" as const,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle-publish",
            isPublished: action === "publish",
          }),
        },
      };
    }

    if (action === "pin" || action === "unpin") {
      return {
        endpoint: `/api/admin/posts/${postId}`,
        init: {
          method: "PATCH" as const,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle-pin",
            isPinned: action === "pin",
          }),
        },
      };
    }

    return {
      endpoint: `/api/admin/posts/${postId}`,
      init: {
        method: "PATCH" as const,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "trash" ? "trash" : "restore",
        }),
      },
    };
  }

  async function bulkMutatePosts(
    boardId: number,
    scope: PostScope,
    postIds: number[],
    action: BulkPostAction,
  ) {
    if (postIds.length === 0) {
      onStatus("선택된 게시글이 없습니다.");
      return;
    }

    setBulkMutatingKey(`${boardId}:${scope}:${action}`);
    onStatus("");

    try {
      const results = await Promise.allSettled(
        postIds.map(async (postId) => {
          const request = createBulkRequest(action, postId);
          const response = await fetch(request.endpoint, request.init);
          await readJson(response);
        }),
      );

      const successCount = results.filter((item) => item.status === "fulfilled").length;
      const failedCount = postIds.length - successCount;
      await loadPosts(boardId, scope);
      await refreshBoards();

      if (failedCount === 0) {
        onStatus(`${successCount}개 게시글 일괄 작업이 완료되었습니다.`);
      } else {
        onStatus(
          `${successCount}개 완료, ${failedCount}개 실패했습니다. 잠시 후 다시 시도해 주세요.`,
        );
      }
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "일괄 작업 처리에 실패했습니다.");
    } finally {
      setBulkMutatingKey(null);
    }
  }

  function openPostManager(board: AdminBoard) {
    setPostManagerBoardId(board.id);
    const scope = postPanels[board.id]?.scope ?? "active";
    void loadPosts(board.id, scope);
  }

  return (
    <div className="admin-board-manager relative space-y-6">
      {confirmModal !== null && (
        <ConfirmDialog
          modal={confirmModal}
          onUpdateInput={(value) =>
            confirmModal.type === "hard-delete"
              ? setConfirmModal({ ...confirmModal, inputValue: value })
              : undefined
          }
          onCancel={() => setConfirmModal(null)}
          onConfirmDeactivate={executeDeactivate}
          onConfirmHardDelete={executeHardDelete}
        />
      )}

      {postManagerBoard !== null && (
        <PostManagerModal
          board={postManagerBoard}
          panel={postPanels[postManagerBoard.id]}
          bulkMutatingKey={bulkMutatingKey}
          onClose={() => setPostManagerBoardId(null)}
          onRefreshPosts={loadPosts}
          onBulkAction={bulkMutatePosts}
          onTogglePublish={(boardId, post) =>
            mutatePost(boardId, post.id, {
              method: "PATCH",
              body: { action: "toggle-publish", isPublished: !post.isPublished },
            })
          }
          onTogglePin={(boardId, post) =>
            mutatePost(boardId, post.id, {
              method: "PATCH",
              body: { action: "toggle-pin", isPinned: !post.isPinned },
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

      <section className="admin-panel relative overflow-hidden rounded-[24px]">
        <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--hub-border)" }}>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{ backgroundColor: "var(--hub-accent-soft)", color: "var(--hub-accent)" }}
          >
            +
          </span>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              New Board
            </p>
            <h2 className="text-sm font-semibold text-white">게시판 생성</h2>
          </div>
        </div>

        <form onSubmit={createBoard} className="grid gap-3 px-6 py-5 md:grid-cols-5">
          <input
            value={newBoard.title}
            onChange={(event) => setNewBoard((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="게시판 이름"
            required
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <input
            value={newBoard.slug}
            onChange={(event) =>
              setNewBoard((prev) => ({
                ...prev,
                slug: event.target.value.trim().toLowerCase(),
              }))
            }
            placeholder="슬러그"
            required
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <input
            value={newBoard.description}
            onChange={(event) =>
              setNewBoard((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="설명 (선택)"
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <input
            type="number"
            value={newBoard.order}
            onChange={(event) => setNewBoard((prev) => ({ ...prev, order: event.target.value }))}
            className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={newBoard.isAdminWriteOnly}
                onChange={(event) =>
                  setNewBoard((prev) => ({
                    ...prev,
                    isAdminWriteOnly: event.target.checked,
                  }))
                }
                className="h-3.5 w-3.5 accent-emerald-400"
              />
              관리자 전용 작성
            </label>
            <button
              type="submit"
              disabled={creating}
              className="ml-auto rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "생성 중.." : "생성"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel relative overflow-hidden rounded-[24px]">
        <div className="border-b px-6 py-4" style={{ borderColor: "var(--hub-border)" }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest [font-family:var(--font-space-grotesk),sans-serif]"
            style={{ color: "var(--hub-accent)" }}
          >
            Board Management
          </p>
          <h2 className="text-sm font-semibold text-white">게시판 리스트</h2>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: "var(--hub-border)" }}>
          <button
            type="button"
            onClick={() => setBoardTab("active")}
            className={[
              "mr-5 py-2 text-sm font-semibold transition-colors",
              boardTab === "active" ? "text-emerald-300" : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            활성 게시판 ({sortedActiveBoards.length})
          </button>
          <button
            type="button"
            onClick={() => setBoardTab("inactive")}
            className={[
              "py-2 text-sm font-semibold transition-colors",
              boardTab === "inactive" ? "text-amber-300" : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            비활성 게시판 ({sortedInactiveBoards.length})
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() =>
                setBoardListPageByTab((prev) => ({
                  ...prev,
                  [boardTab]: Math.max(1, prev[boardTab] - 1),
                }))
              }
              disabled={!boardListPagination.canGoPrev}
              className="-mr-3 h-14 w-12 shrink-0 rounded-none border-0 bg-transparent text-[1.7rem] font-bold text-slate-400 transition hover:bg-transparent hover:text-white disabled:opacity-20"
              aria-label="이전 게시판 목록"
            >
              &lsaquo;
            </button>

            <aside className="min-w-0 flex-1 rounded-xl bg-black/25 px-2 py-3">
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="search"
                    value={boardSearchQuery}
                    onChange={(event) => setBoardSearchQuery(event.target.value)}
                    placeholder="제목, 슬러그, 설명 검색"
                    className="h-9 w-full rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/60"
                    aria-label="게시판 검색"
                  />
                  {boardSearchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setBoardSearchQuery("")}
                      className="h-9 shrink-0 rounded-lg border border-white/20 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                    >
                      초기화
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredBoards.length}개 / 전체 {currentBoards.length}개
                </p>
              </div>

              <div className="space-y-2">
                {currentBoards.length === 0 && (
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-4 text-center text-sm text-slate-500">
                    게시판이 없습니다.
                  </p>
                )}

                {currentBoards.length > 0 && filteredBoards.length === 0 && (
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-4 text-center text-sm text-slate-500">
                    검색 결과가 없습니다.
                  </p>
                )}

                {boardListSlots.map((board, index) => {
                  if (board === null) {
                    return (
                      <div
                        key={`empty-slot-${boardTab}-${boardListPagination.currentPage}-${index}`}
                        aria-hidden="true"
                        className="h-[92px] w-full rounded-lg border border-white/10 bg-black/15"
                      />
                    );
                  }

                  const isSelected = selectedBoard?.id === board.id;
                  return (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => selectBoard(boardTab, board.id)}
                      className={[
                        "h-[92px] w-full rounded-lg border px-3 py-3 text-left transition",
                        isSelected
                          ? "border-emerald-300/50 bg-emerald-400/10"
                          : "border-white/10 bg-black/25 hover:border-white/25",
                      ].join(" ")}
                    >
                      <p className="truncate text-sm font-semibold text-white">{board.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">/{board.slug}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                          글 {board._count?.posts ?? 0}
                        </span>
                        {board.isSystemProtected && (
                          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">
                            삭제 불가
                          </span>
                        )}
                        {board.isAdminWriteOnly && (
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-200">
                            관리자 전용 작성
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {boardListTotalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {boardListPageNumbers.map((pageNumber) => (
                    <button
                      key={`${boardTab}-page-${pageNumber}`}
                      type="button"
                      onClick={() =>
                        setBoardListPageByTab((prev) => ({
                          ...prev,
                          [boardTab]: pageNumber,
                        }))
                      }
                      className={[
                        "admin-pagination-button inline-flex h-8 min-w-8 items-center justify-center px-2 text-[11px] font-semibold transition",
                        pageNumber === currentBoardListPage
                          ? "admin-pagination-button--active"
                          : "",
                      ].join(" ")}
                      aria-label={`페이지 ${pageNumber} 이동`}
                      aria-current={pageNumber === currentBoardListPage ? "page" : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <button
              type="button"
              onClick={() =>
                setBoardListPageByTab((prev) => ({
                  ...prev,
                  [boardTab]: Math.min(boardListPagination.totalPages, prev[boardTab] + 1),
                }))
              }
              disabled={!boardListPagination.canGoNext}
              className="-ml-3 h-14 w-12 shrink-0 rounded-none border-0 bg-transparent text-[1.7rem] font-bold text-slate-400 transition hover:bg-transparent hover:text-white disabled:opacity-20"
              aria-label="다음 게시판 목록"
            >
              &rsaquo;
            </button>
          </div>

          <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-4">
            {selectedBoard === null ? (
              <p className="py-8 text-center text-sm text-slate-500">
                왼쪽 목록에서 게시판을 선택해 주세요.
              </p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Selected Board
                    </p>
                    <h3 className="text-lg font-semibold text-white">{selectedBoard.title}</h3>
                    {selectedBoard.isSystemProtected && (
                      <p className="mt-1 text-xs text-cyan-100">
                        시스템 보호 게시판입니다. 순서 조정과 게시글 관리는 가능하지만 삭제는 차단됩니다.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      제목
                    </span>
                    <input
                      value={selectedBoard.title}
                      onChange={(event) =>
                        editBoard(
                          selectedBoard.id,
                          "title",
                          event.target.value,
                          boardTab === "active",
                        )
                      }
                      className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      슬러그
                    </span>
                    <input
                      value={selectedBoard.slug}
                      onChange={(event) =>
                        editBoard(
                          selectedBoard.id,
                          "slug",
                          event.target.value.trim().toLowerCase(),
                          boardTab === "active",
                        )
                      }
                      className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 font-mono text-sm text-white outline-none focus:border-white/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      설명
                    </span>
                    <input
                      value={selectedBoard.description ?? ""}
                      onChange={(event) =>
                        editBoard(
                          selectedBoard.id,
                          "description",
                          event.target.value,
                          boardTab === "active",
                        )
                      }
                      className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
                    />
                  </label>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        정렬 순서
                      </span>
                      <input
                        type="number"
                        value={selectedBoard.order}
                        onChange={(event) =>
                          editBoard(
                            selectedBoard.id,
                            "order",
                            Number(event.target.value),
                            boardTab === "active",
                          )
                        }
                        className="h-8 w-24 rounded-lg border border-white/20 bg-black/35 px-2 text-sm text-white outline-none focus:border-white/40"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedBoard.isAdminWriteOnly}
                        onChange={(event) =>
                          editBoard(
                            selectedBoard.id,
                            "isAdminWriteOnly",
                            event.target.checked,
                            boardTab === "active",
                          )
                        }
                        className="h-3.5 w-3.5 accent-emerald-400"
                      />
                      관리자만 작성 가능
                    </label>

                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={savingBoardId === selectedBoard.id}
                        onClick={() => saveBoard(selectedBoard, boardTab === "active")}
                        className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-60"
                      >
                        {savingBoardId === selectedBoard.id ? "저장 중.." : "저장"}
                      </button>

                      {boardTab === "active" ? (
                        <button
                          type="button"
                          disabled={mutatingBoardId === selectedBoard.id}
                          onClick={() => deactivateBoard(selectedBoard)}
                          className="rounded-full border border-amber-300/50 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-60"
                        >
                          {mutatingBoardId === selectedBoard.id ? "처리 중.." : "비활성화"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={mutatingBoardId === selectedBoard.id}
                            onClick={() => restoreBoard(selectedBoard.id)}
                            className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-60"
                          >
                            {mutatingBoardId === selectedBoard.id ? "처리 중.." : "복구"}
                          </button>
                          {selectedBoard.isSystemProtected ? (
                            <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-xs font-semibold text-cyan-100">
                              시스템 보호로 삭제 불가
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={mutatingBoardId === selectedBoard.id}
                              onClick={() => hardDeleteBoard(selectedBoard)}
                              className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60"
                            >
                              {mutatingBoardId === selectedBoard.id ? "처리 중.." : "최종 삭제"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => openPostManager(selectedBoard)}
                    className="rounded-full border border-cyan-300/50 px-4 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
                  >
                    게시글 관리 열기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
function PostManagerModal({
  board,
  panel,
  bulkMutatingKey,
  onClose,
  onRefreshPosts,
  onBulkAction,
  onTogglePublish,
  onTogglePin,
  onTrashPost,
  onRestorePost,
  onDeletePost,
}: PostManagerModalProps) {
  const scope = panel?.scope ?? "active";
  const posts = panel?.posts ?? [];
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const isBulkMutating = bulkMutatingKey?.startsWith(`${board.id}:${scope}:`) ?? false;
  const allChecked =
    posts.length > 0 && posts.every((post) => selectedPostIds.includes(post.id));
  const pagination = buildPaginationState({
    currentPage,
    totalItems: posts.length,
    itemsPerPage: POST_PAGE_SIZE,
    windowSize: POST_PAGE_WINDOW_SIZE,
  });
  const currentPagePosts = posts.slice(
    (pagination.currentPage - 1) * POST_PAGE_SIZE,
    pagination.currentPage * POST_PAGE_SIZE,
  );

  useEffect(() => {
    setSelectedPostIds((prev) => prev.filter((id) => posts.some((post) => post.id === id)));
  }, [posts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scope, board.id]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [currentPage, pagination.totalPages]);

  function togglePost(postId: number, checked: boolean) {
    setSelectedPostIds((prev) => {
      if (checked) {
        return prev.includes(postId) ? prev : [...prev, postId];
      }
      return prev.filter((id) => id !== postId);
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedPostIds(checked ? posts.map((post) => post.id) : []);
  }

  async function runBulkAction(action: BulkPostAction) {
    if (selectedPostIds.length === 0) {
      return;
    }
    await onBulkAction(board.id, scope, selectedPostIds, action);
    setSelectedPostIds([]);
  }

  return (
    <div className="absolute inset-0 z-[90] bg-black/70 backdrop-blur-sm">
      <div className="admin-panel flex h-full w-full flex-col overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--hub-border)" }}>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Post Management
            </p>
            <h3 className="text-lg font-semibold text-white">
              {board.title} 게시글 집중 관리
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
          >
            닫기
          </button>
        </div>

        <div className="flex items-center gap-2 border-b px-6 py-3" style={{ borderColor: "var(--hub-border)" }}>
          <button
            type="button"
            onClick={() => onRefreshPosts(board.id, "active")}
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
            onClick={() => onRefreshPosts(board.id, "trash")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              scope === "trash"
                ? "bg-amber-300 text-zinc-950"
                : "border border-white/25 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            휴지통
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b px-6 py-3" style={{ borderColor: "var(--hub-border)" }}>
          <label className="mr-2 flex items-center gap-1 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={allChecked}
              disabled={posts.length === 0 || isBulkMutating}
              onChange={(event) => toggleAll(event.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-400"
            />
            전체 선택
          </label>
          <span className="mr-2 text-[11px] text-slate-500">
            {selectedPostIds.length}개 선택됨
          </span>
          {scope === "active" ? (
            <>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("publish")}
                className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-40"
              >
                일괄 공개
              </button>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("unpublish")}
                className="rounded-full border border-slate-300/40 px-2 py-0.5 text-[11px] font-semibold text-slate-100 transition hover:bg-slate-400/10 disabled:opacity-40"
              >
                일괄 비공개
              </button>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("pin")}
                className="rounded-full border border-cyan-300/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:opacity-40"
              >
                일괄 상단고정
              </button>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("unpin")}
                className="rounded-full border border-cyan-300/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:opacity-40"
              >
                일괄 고정해제
              </button>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("trash")}
                className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
              >
                일괄 휴지통 이동
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("restore")}
                className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-40"
              >
                일괄 복구
              </button>
              <button
                type="button"
                disabled={selectedPostIds.length === 0 || isBulkMutating}
                onClick={() => runBulkAction("delete")}
                className="rounded-full border border-rose-300/40 px-2 py-0.5 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-40"
              >
                일괄 영구 삭제
              </button>
            </>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          {panel?.loading && <p className="text-sm text-slate-400">게시글을 불러오는 중입니다...</p>}
          {panel?.error && <p className="text-sm text-rose-300">{panel.error}</p>}
          {!panel?.loading && posts.length === 0 && (
            <p className="text-sm text-slate-500">게시글이 없습니다.</p>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 md:grid-rows-3">
            {currentPagePosts.map((post) => {
              const previewImage = extractFirstImageUrl(post.content);
              const previewText = toPreviewText(post.content);

              return (
                <article
                  key={post.id}
                  className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPostIds.includes(post.id)}
                        disabled={isBulkMutating}
                        onChange={(event) => togglePost(post.id, event.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-emerald-400"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{post.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {post.author.email} · {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {post.isPinned && !post.deletedAt && (
                        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] text-cyan-200">
                          고정
                        </span>
                      )}
                      {!post.deletedAt && (
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[10px]",
                            post.isPublished
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-white/10 text-slate-400",
                          ].join(" ")}
                        >
                          {post.isPublished ? "공개" : "비공개"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/40">
                      {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewImage}
                          alt="게시글 미리보기"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{previewText}</p>
                  </div>

                  <div className="mt-auto flex gap-1 overflow-x-auto pt-2">
                    {!post.deletedAt ? (
                      <>
                        <button
                          type="button"
                          disabled={isBulkMutating}
                          onClick={() => onTogglePublish(board.id, post)}
                          className="rounded-full border border-cyan-300/50 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:opacity-40"
                        >
                          {post.isPublished ? "비공개 전환" : "공개 전환"}
                        </button>
                        <button
                          type="button"
                          disabled={isBulkMutating}
                          onClick={() => onTogglePin(board.id, post)}
                          className="rounded-full border border-cyan-300/50 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:opacity-40"
                        >
                          {post.isPinned ? "고정 해제" : "상단 고정"}
                        </button>
                        <button
                          type="button"
                          disabled={isBulkMutating}
                          onClick={() => onTrashPost(board.id, post)}
                          className="rounded-full border border-amber-300/50 px-2 py-0.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
                        >
                          휴지통 이동
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isBulkMutating}
                          onClick={() => onRestorePost(board.id, post)}
                          className="rounded-full border border-emerald-300/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/10 disabled:opacity-40"
                        >
                          복구
                        </button>
                        <button
                          type="button"
                          disabled={isBulkMutating}
                          onClick={() => onDeletePost(board.id, post)}
                          className="rounded-full border border-rose-300/50 px-2 py-0.5 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-40"
                        >
                          영구 삭제
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {posts.length > 0 && (
            <PaginationControls
              mode="button"
              pagination={pagination}
              onPageChange={setCurrentPage}
              className="mt-4 flex shrink-0 items-center justify-center gap-1"
              pageClassName="rounded-md border px-2.5 py-1 text-xs font-semibold transition"
              activePageClassName="border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
              inactivePageClassName="border-white/20 text-slate-300 hover:bg-white/10"
              navClassName="w-8 rounded-md border border-white/20 py-1 text-xs text-slate-300 transition hover:bg-white/10"
              navDisabledClassName="w-8 rounded-md border border-white/20 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            />
          )}
        </div>
      </div>
    </div>
  );
}
type ConfirmDialogProps = {
  modal: NonNullable<ConfirmModal>;
  onUpdateInput: (value: string) => void;
  onCancel: () => void;
  onConfirmDeactivate: (boardId: number) => void;
  onConfirmHardDelete: (board: AdminBoard, inputValue: string) => void;
};

function ConfirmDialog({
  modal,
  onUpdateInput,
  onCancel,
  onConfirmDeactivate,
  onConfirmHardDelete,
}: ConfirmDialogProps) {
  const isHardDelete = modal.type === "hard-delete";
  const inputValue = isHardDelete ? modal.inputValue : "";
  const targetTitle = isHardDelete ? modal.board.title : modal.boardTitle;
  const isDeleteDisabled = isHardDelete && inputValue !== modal.board.title;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-[24px] border shadow-2xl"
        style={{
          borderColor: isHardDelete ? "var(--hub-danger-border)" : "var(--hub-outline)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--hub-surface) 94%, white 6%) 0%, var(--hub-surface) 100%)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="h-1 w-full"
          style={{
            background: isHardDelete
              ? "linear-gradient(90deg,#ef4444,#f87171)"
              : "linear-gradient(90deg,#f59e0b,#fcd34d)",
          }}
        />

        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <span
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
                isHardDelete
                  ? "bg-rose-400/15 text-rose-300"
                  : "bg-amber-400/15 text-amber-300",
              ].join(" ")}
            >
              {isHardDelete ? "⚠" : "?"}
            </span>

            <div>
              <p
                className={[
                  "text-sm font-bold",
                  isHardDelete ? "text-rose-300" : "text-amber-300",
                ].join(" ")}
              >
                {isHardDelete ? "게시판 영구 삭제" : "게시판 비활성화"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                {isHardDelete ? (
                  <>
                    <span className="font-semibold text-white">{targetTitle}</span>{" "}
                    게시판과 모든 게시글을 영구 삭제합니다.
                    <br />
                    <span className="text-rose-300">이 작업은 되돌릴 수 없습니다.</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">{targetTitle}</span>{" "}
                    게시판을 비활성화합니다.
                    <br />
                    비활성 구역에서 복구할 수 있습니다.
                  </>
                )}
              </p>
            </div>
          </div>

          {isHardDelete && (
            <div className="mt-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  게시판 이름을 정확히 입력해야 삭제할 수 있습니다.
                </span>
                <span className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-rose-200">
                  {targetTitle}
                </span>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(event) => onUpdateInput(event.target.value)}
                  placeholder={targetTitle}
                  className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-rose-400/60 placeholder:text-slate-600"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/8"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isDeleteDisabled}
              onClick={() => {
                if (modal.type === "deactivate") {
                  onConfirmDeactivate(modal.boardId);
                } else {
                  onConfirmHardDelete(modal.board, modal.inputValue);
                }
              }}
              className={[
                "rounded-full px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40",
                isHardDelete
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-amber-400 text-zinc-950 hover:bg-amber-300",
              ].join(" ")}
            >
              {isHardDelete ? "영구 삭제" : "비활성화"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
