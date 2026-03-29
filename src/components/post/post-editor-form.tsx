"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Editor as ToastEditorType } from "@toast-ui/react-editor";
import { PostCombinationEditor } from "@/components/post/post-combination-editor";
import {
  normalizePostCombinationData,
  type PostCombinationData,
  type SelectableCharacter,
} from "@/lib/post-combination";

const ToastEditor = dynamic(
  () => import("@toast-ui/react-editor").then((mod) => mod.Editor),
  { ssr: false },
);

type PostEditorFormProps = {
  boardId: number;
  boardSlug: string;
  mode: "create" | "edit";
  postId?: number;
  initialTitle?: string;
  initialContent?: string;
  isAdmin?: boolean;
  initialIsPinned?: boolean;
  availableCharacters: SelectableCharacter[];
  initialCombinationData?: PostCombinationData | null;
};

export function PostEditorForm({
  boardId,
  boardSlug,
  mode,
  postId,
  initialTitle = "",
  initialContent = "",
  isAdmin = false,
  initialIsPinned = false,
  availableCharacters,
  initialCombinationData,
}: PostEditorFormProps) {
  const router = useRouter();
  const editorRef = useRef<ToastEditorType>(null);
  const normalizedInitialCombinationData = normalizePostCombinationData(initialCombinationData);
  const [title, setTitle] = useState(initialTitle);
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [isCombinationOpen, setIsCombinationOpen] = useState(
    normalizedInitialCombinationData.characters.length > 0 ||
      normalizedInitialCombinationData.skills.length > 0,
  );
  const [combinationData, setCombinationData] = useState<PostCombinationData>(
    normalizedInitialCombinationData,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorInitialValue = mode === "create" ? " " : initialContent || " ";
  const editorRenderKey = mode === "create" ? `create-${boardId}` : `edit-${postId ?? 0}`;

  const submitLabel = useMemo(() => {
    if (submitting) {
      return mode === "create" ? "등록 중..." : "수정 중...";
    }
    return mode === "create" ? "게시글 등록" : "게시글 수정";
  }, [mode, submitting]);

  useEffect(() => {
    const editor = editorRef.current;

    return () => {
      try {
        editor?.getInstance()?.destroy();
      } catch {
        // no-op
      }
    };
  }, []);

  async function uploadEditorImage(blob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("image", blob);

    const response = await fetch("/api/uploads/posts", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
    };

    if (!response.ok || !data.url) {
      throw new Error(data.message ?? "Image upload failed.");
    }

    return data.url;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const editorInstance = editorRef.current?.getInstance();
      const rawContent = editorInstance?.getHTML() ?? "";
      const content = normalizeEditorHtml(rawContent);

      const payload = {
        boardId,
        title,
        content,
        combinationData,
        ...(isAdmin && mode === "create" ? { isPinned } : {}),
      };

      const response = await fetch(
        mode === "create" ? "/api/posts" : `/api/posts/${postId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body:
            mode === "create"
              ? JSON.stringify(payload)
              : JSON.stringify({
                  title: payload.title,
                  content: payload.content,
                  combinationData: payload.combinationData,
                  ...(isAdmin ? { isPinned } : {}),
                }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        post?: { id: number };
        boardSlug?: string;
        message?: string;
      };

      if (!response.ok || !data.post?.id) {
        throw new Error(data.message ?? "Failed to save post.");
      }

      const nextBoardSlug = data.boardSlug || boardSlug;
      router.push(`/board/${nextBoardSlug}/${data.post.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        minLength={2}
        maxLength={120}
        placeholder="제목"
        className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
      />

      <PostCombinationEditor
        isOpen={isCombinationOpen}
        onToggle={() => setIsCombinationOpen((current) => !current)}
        characters={availableCharacters}
        value={combinationData}
        onChange={setCombinationData}
      />

      <div className="post-editor-shell rounded-xl border border-white/15 bg-black/25 p-2">
        <ToastEditor
          key={editorRenderKey}
          ref={editorRef}
          initialValue={editorInitialValue}
          previewStyle="vertical"
          initialEditType="wysiwyg"
          height="420px"
          usageStatistics={false}
          onLoad={() => {
            const editorInstance = editorRef.current?.getInstance();
            if (editorInstance) {
              if (mode === "create" || !initialContent.trim()) {
                editorInstance.setMarkdown("", false);
              }
              if (editorInstance.getCurrentPreviewStyle() !== "vertical") {
                editorInstance.changePreviewStyle("vertical");
              }
              if (!editorInstance.isWysiwygMode()) {
                editorInstance.changeMode("wysiwyg", true);
              }
            }
          }}
          hooks={{
            addImageBlobHook: async (
              blob: Blob | File,
              callback: (url: string, text?: string) => void,
            ) => {
              try {
                const url = await uploadEditorImage(blob);
                callback(url, blob instanceof File ? blob.name : "image");
              } catch (uploadError) {
                setError(
                  uploadError instanceof Error
                    ? uploadError.message
                    : "Image upload failed.",
                );
              }
            },
          }}
        />
      </div>

      {/* 관리자 전용 — 필수 공지 등록 / 고정 여부 */}
      {isAdmin && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 transition hover:bg-amber-400/10">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 accent-amber-400"
          />
          <div>
            <span className="text-sm font-semibold text-amber-300">
              {mode === "create" ? "필수 공지로 등록" : "상단 고정 (필수 공지)"}
            </span>
            <p className="text-xs text-zinc-400">체크 시 게시판 상단에 고정되어 모든 사용자에게 우선 표시됩니다.</p>
          </div>
        </label>
      )}

      {error ? (
        <p className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push(`/board/${boardSlug}`)}
          className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function normalizeEditorHtml(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed === "<p><br></p>" ||
    trimmed === "<p></p>" ||
    trimmed === "<div><br></div>" ||
    trimmed === "<br>"
  ) {
    return "";
  }
  return trimmed;
}
