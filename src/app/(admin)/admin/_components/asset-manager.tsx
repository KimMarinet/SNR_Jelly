"use client";

import type { AssetCategory } from "@/generated/prisma";
import { FormEvent, useMemo, useRef, useState } from "react";
import { readJson } from "./http";
import type { AdminAsset } from "./types";

type AssetManagerProps = {
  initialActiveAssets: AdminAsset[];
  initialTrashedAssets: AdminAsset[];
  onStatus: (message: string) => void;
};

const CATEGORY_OPTIONS: AssetCategory[] = ["CHARACTER", "SKILL", "COMMON"];

function getCategoryLabel(category: AssetCategory): string {
  if (category === "CHARACTER") return "캐릭터";
  if (category === "SKILL") return "스킬";
  return "공통";
}

export function AssetManager({
  initialActiveAssets,
  initialTrashedAssets,
  onStatus,
}: AssetManagerProps) {
  const [activeAssets, setActiveAssets] = useState(initialActiveAssets);
  const [trashedAssets, setTrashedAssets] = useState(initialTrashedAssets);
  const [assetScope, setAssetScope] = useState<"active" | "trash">("active");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>("COMMON");
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const visibleAssets = useMemo(() => {
    const source = assetScope === "active" ? activeAssets : trashedAssets;
    const query = search.trim().toLowerCase();

    return source.filter((asset) => {
      const matchesCategory =
        categoryFilter === "ALL" || asset.category === categoryFilter;
      const matchesSearch =
        !query ||
        asset.originalName.toLowerCase().includes(query) ||
        asset.storedName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeAssets, assetScope, categoryFilter, search, trashedAssets]);

  async function refreshAssets() {
    const [activeResponse, trashResponse] = await Promise.all([
      fetch("/api/admin/assets?scope=active", { cache: "no-store" }),
      fetch("/api/admin/assets?scope=trash", { cache: "no-store" }),
    ]);
    const [activeData, trashData] = await Promise.all([
      readJson<{ assets: AdminAsset[] }>(activeResponse),
      readJson<{ assets: AdminAsset[] }>(trashResponse),
    ]);

    setActiveAssets(activeData.assets);
    setTrashedAssets(trashData.assets);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      onStatus("업로드할 파일을 먼저 선택해 주세요.");
      return;
    }

    setUploading(true);
    onStatus("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);

      const response = await fetch("/api/admin/assets", {
        method: "POST",
        body: formData,
      });
      const data = await readJson<{ asset: AdminAsset }>(response);

      setActiveAssets((prev) => [data.asset, ...prev]);
      setUploadFile(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
      onStatus(`업로드 완료: ${data.asset.originalName}`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function trashAsset(id: number) {
    try {
      const response = await fetch(`/api/admin/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash" }),
      });
      await readJson(response);
      await refreshAssets();
      onStatus("파일을 휴지통으로 이동했습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "휴지통 이동에 실패했습니다.");
    }
  }

  async function restoreAsset(id: number) {
    try {
      const response = await fetch(`/api/admin/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      await readJson(response);
      await refreshAssets();
      onStatus("파일을 복구했습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "파일 복구에 실패했습니다.");
    }
  }

  async function hardDeleteAsset(id: number) {
    if (!window.confirm("이 파일을 영구 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
      await readJson(response);
      await refreshAssets();
      onStatus("파일을 영구 삭제했습니다.");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "영구 삭제에 실패했습니다.");
    }
  }

  async function copyPublicUrl(publicUrl: string) {
    const absoluteUrl = new URL(publicUrl, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      onStatus("공개 URL을 복사했습니다.");
    } catch {
      onStatus(absoluteUrl);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/30 p-5">
      <h2 className="text-lg font-semibold text-white">파일 관리</h2>
      <form onSubmit={handleUpload} className="mt-4 grid gap-3 md:grid-cols-4">
        <select
          value={uploadCategory}
          onChange={(event) => setUploadCategory(event.target.value as AssetCategory)}
          className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
        >
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(event) => setUploadFile(event.currentTarget.files?.[0] ?? null)}
          className="rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white md:col-span-2"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAssetScope("active")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            assetScope === "active"
              ? "bg-emerald-300 text-zinc-950"
              : "border border-white/25 text-zinc-100"
          }`}
        >
          활성 파일 ({activeAssets.length})
        </button>
        <button
          type="button"
          onClick={() => setAssetScope("trash")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            assetScope === "trash"
              ? "bg-amber-300 text-zinc-950"
              : "border border-white/25 text-zinc-100"
          }`}
        >
          휴지통 ({trashedAssets.length})
        </button>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as AssetCategory | "ALL")}
          className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-zinc-100 outline-none"
        >
          <option value="ALL">전체</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="파일명 검색"
          className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-zinc-100 outline-none"
        />
      </div>

      <div className="mt-4 space-y-2">
        {visibleAssets.length === 0 ? (
          <p className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-zinc-300">
            표시할 파일이 없습니다.
          </p>
        ) : (
          visibleAssets.map((asset) => (
            <article key={asset.id} className="rounded-xl border border-white/15 bg-black/35 p-3">
              <p className="text-sm font-semibold text-white">{asset.originalName}</p>
              <p className="text-xs text-zinc-300">
                {getCategoryLabel(asset.category)} | {(asset.size / 1024).toFixed(1)} KB
              </p>
              <p className="mt-1 text-xs text-zinc-400">{asset.publicUrl}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyPublicUrl(asset.publicUrl)}
                  className="rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-100"
                >
                  URL 복사
                </button>
                {assetScope === "active" ? (
                  <button
                    type="button"
                    onClick={() => trashAsset(asset.id)}
                    className="rounded-full border border-amber-300/50 px-3 py-1 text-xs font-semibold text-amber-100"
                  >
                    휴지통 이동
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => restoreAsset(asset.id)}
                      className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-100"
                    >
                      복구
                    </button>
                    <button
                      type="button"
                      onClick={() => hardDeleteAsset(asset.id)}
                      className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-100"
                    >
                      영구 삭제
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
