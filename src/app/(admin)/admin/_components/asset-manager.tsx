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
      onStatus(caught instanceof Error ? caught.message : "업로드에 실패했습니다.");
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
    <section className="admin-panel relative overflow-hidden rounded-[24px] p-5 md:p-6">
      <div className="flex flex-col gap-5 border-b pb-5" style={{ borderColor: "var(--hub-border)" }}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              파일 보급선
            </p>
            <h2
              className="mt-2 text-2xl font-black uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-text)" }}
            >
              파일 관리
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>
              공용 이미지와 자료 파일을 업로드하고, 카테고리별로 빠르게 분류하며, 삭제 대기 파일까지
              함께 관리하는 구역입니다.
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
              활성 {activeAssets.length}
            </span>
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
            >
              휴지통 {trashedAssets.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)_auto]">
          <select
            value={uploadCategory}
            onChange={(event) => setUploadCategory(event.target.value as AssetCategory)}
            aria-label="업로드 카테고리"
            className="rounded-2xl px-3 py-3 text-sm outline-none"
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
            className="rounded-2xl px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className="admin-link-chip admin-link-chip--primary admin-button-keep h-fit disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? "업로드 중" : "파일 업로드"}
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAssetScope("active")}
          className="rounded-full border px-3 py-1 text-xs font-semibold transition"
          style={
            assetScope === "active"
              ? {
                  borderColor: "var(--hub-outline)",
                  backgroundColor: "var(--hub-accent-soft)",
                  color: "var(--hub-accent)",
                }
              : { borderColor: "var(--hub-border)", color: "var(--hub-muted)" }
          }
        >
          활성 파일 ({activeAssets.length})
        </button>
        <button
          type="button"
          onClick={() => setAssetScope("trash")}
          className="rounded-full border px-3 py-1 text-xs font-semibold transition"
          style={
            assetScope === "trash"
              ? {
                  borderColor: "var(--hub-danger-border)",
                  backgroundColor: "var(--hub-danger-bg)",
                  color: "var(--hub-danger-text)",
                }
              : { borderColor: "var(--hub-border)", color: "var(--hub-muted)" }
          }
        >
          휴지통 ({trashedAssets.length})
        </button>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as AssetCategory | "ALL")}
          className="rounded-full px-3 py-1 text-xs outline-none"
          aria-label="카테고리 필터"
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
          className="rounded-full px-3 py-1 text-xs outline-none"
        />
      </div>

      <div className="mt-5 space-y-3">
        {visibleAssets.length === 0 ? (
          <p
            className="rounded-2xl border px-4 py-4 text-sm"
            style={{
              borderColor: "var(--hub-border)",
              backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 76%, transparent)",
              color: "var(--hub-muted)",
            }}
          >
            현재 조건에 맞는 파일이 없습니다.
          </p>
        ) : (
          visibleAssets.map((asset) => (
            <article
              key={asset.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--hub-border)",
                backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 72%, transparent)",
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                      {asset.originalName}
                    </p>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: "var(--hub-outline)",
                        backgroundColor: "var(--hub-accent-soft)",
                        color: "var(--hub-accent)",
                      }}
                    >
                      {getCategoryLabel(asset.category)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--hub-muted)" }}>
                    {(asset.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="mt-2 break-all text-xs" style={{ color: "var(--hub-muted)" }}>
                    {asset.publicUrl}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyPublicUrl(asset.publicUrl)}
                    className="admin-button-keep rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{ borderColor: "var(--hub-outline)", color: "var(--hub-accent)" }}
                  >
                    URL 복사
                  </button>
                  {assetScope === "active" ? (
                    <button
                      type="button"
                      onClick={() => trashAsset(asset.id)}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
                    >
                      휴지통 이동
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => restoreAsset(asset.id)}
                        className="rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{ borderColor: "var(--hub-outline)", color: "var(--hub-accent)" }}
                      >
                        복구
                      </button>
                      <button
                        type="button"
                        onClick={() => hardDeleteAsset(asset.id)}
                        className="rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{
                          borderColor: "var(--hub-danger-border)",
                          color: "var(--hub-danger-text)",
                        }}
                      >
                        영구 삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
