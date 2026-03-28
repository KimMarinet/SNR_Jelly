"use client";

import type {
  CharacterAttackType,
  CharacterRole,
} from "@/generated/prisma";
import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  CHARACTER_ATTACK_TYPE_OPTIONS,
  CHARACTER_ROLE_OPTIONS,
  CHARACTER_STAT_OPTIONS,
  createDefaultTranscendenceEntries,
  getCharacterAttackTypeLabel,
  getCharacterRoleLabel,
  getCharacterStatLabel,
  normalizeTranscendenceEntries,
  type CharacterStatKey,
  type CharacterTranscendenceEntry,
} from "@/lib/character-admin";
import { readJson } from "./http";
import type { AdminCharacter } from "./types";

type CharacterManagerTab = "manage" | "list";

type CharacterFormState = {
  name: string;
  portraitFile: File | null;
  skillOneName: string;
  skillOneImageFile: File | null;
  skillTwoName: string;
  skillTwoImageFile: File | null;
  skillDescription: string;
  skillTwoDescription: string;
  passiveName: string;
  passiveImageFile: File | null;
  passiveDescription: string;
  role: CharacterRole;
  attackType: CharacterAttackType;
  attackPower: string;
  defense: string;
  health: string;
  speed: string;
  criticalRate: string;
  criticalDamage: string;
  weakPointRate: string;
  blockRate: string;
  damageReduction: string;
  effectAccuracy: string;
  effectResistance: string;
  transcendence: CharacterTranscendenceEntry[];
};

type FileKey = "portraitFile" | "skillOneImageFile" | "skillTwoImageFile" | "passiveImageFile";

type DeleteModalState = {
  id: number;
  name: string;
} | null;

function createEmptyCharacterForm(): CharacterFormState {
  return {
    name: "",
    portraitFile: null,
    skillOneName: "",
    skillOneImageFile: null,
    skillTwoName: "",
    skillTwoImageFile: null,
    skillDescription: "",
    skillTwoDescription: "",
    passiveName: "",
    passiveImageFile: null,
    passiveDescription: "",
    role: "ATTACKER",
    attackType: "PHYSICAL",
    attackPower: "0",
    defense: "0",
    health: "0",
    speed: "0",
    criticalRate: "0",
    criticalDamage: "0",
    weakPointRate: "0",
    blockRate: "0",
    damageReduction: "0",
    effectAccuracy: "0",
    effectResistance: "0",
    transcendence: createDefaultTranscendenceEntries(),
  };
}

function createFormFromCharacter(character: AdminCharacter): CharacterFormState {
  return {
    name: character.name,
    portraitFile: null,
    skillOneName: character.skillOneName,
    skillOneImageFile: null,
    skillTwoName: character.skillTwoName,
    skillTwoImageFile: null,
    skillDescription: character.skillDescription,
    skillTwoDescription: character.skillTwoDescription,
    passiveName: character.passiveName,
    passiveImageFile: null,
    passiveDescription: character.passiveDescription,
    role: character.role,
    attackType: character.attackType,
    attackPower: String(character.attackPower),
    defense: String(character.defense),
    health: String(character.health),
    speed: String(character.speed),
    criticalRate: String(character.criticalRate),
    criticalDamage: String(character.criticalDamage),
    weakPointRate: String(character.weakPointRate),
    blockRate: String(character.blockRate),
    damageReduction: String(character.damageReduction),
    effectAccuracy: String(character.effectAccuracy),
    effectResistance: String(character.effectResistance),
    transcendence: normalizeTranscendenceEntries(character.transcendence),
  };
}

function appendCharacterFormData(formData: FormData, form: CharacterFormState) {
  formData.append("name", form.name.trim());
  formData.append("skillOneName", form.skillOneName.trim());
  formData.append("skillTwoName", form.skillTwoName.trim());
  formData.append("skillDescription", form.skillDescription.trim());
  formData.append("skillTwoDescription", form.skillTwoDescription.trim());
  formData.append("passiveName", form.passiveName.trim());
  formData.append("passiveDescription", form.passiveDescription.trim());
  formData.append("role", form.role);
  formData.append("attackType", form.attackType);
  formData.append("attackPower", form.attackPower);
  formData.append("defense", form.defense);
  formData.append("health", form.health);
  formData.append("speed", form.speed);
  formData.append("criticalRate", form.criticalRate);
  formData.append("criticalDamage", form.criticalDamage);
  formData.append("weakPointRate", form.weakPointRate);
  formData.append("blockRate", form.blockRate);
  formData.append("damageReduction", form.damageReduction);
  formData.append("effectAccuracy", form.effectAccuracy);
  formData.append("effectResistance", form.effectResistance);
  formData.append("transcendence", JSON.stringify(form.transcendence));

  if (form.portraitFile) formData.append("portraitFile", form.portraitFile);
  if (form.skillOneImageFile) formData.append("skillOneImageFile", form.skillOneImageFile);
  if (form.skillTwoImageFile) formData.append("skillTwoImageFile", form.skillTwoImageFile);
  if (form.passiveImageFile) formData.append("passiveImageFile", form.passiveImageFile);
}

function updateCharacterInList(list: AdminCharacter[], character: AdminCharacter) {
  return list.map((item) => (item.id === character.id ? character : item));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role, roleSymbolUrl }: { role: CharacterRole; roleSymbolUrl: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = getCharacterRoleLabel(role);

  return (
    <div
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border text-[10px] font-semibold"
      style={{
        borderColor: "var(--hub-outline)",
        backgroundColor: "color-mix(in srgb, var(--hub-accent-soft) 78%, transparent)",
        color: "var(--hub-accent)",
      }}
      title={label}
    >
      {imageFailed ? (
        <span>{label.slice(0, 2)}</span>
      ) : (
        <img
          src={roleSymbolUrl}
          alt={`${label} 심볼`}
          className="h-7 w-7 object-contain"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

function HoverPreview({ file, previewUrl }: { file: File | null; previewUrl?: string | null }) {
  const [hovered, setHovered] = useState(false);
  const localPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const imageUrl = localPreview ?? previewUrl ?? null;

  return (
    <div
      className="relative flex items-start"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="inline-flex h-8 cursor-default select-none items-center rounded-full border px-3 text-xs font-semibold transition"
        style={{
          borderColor: "var(--hub-border)",
          color: imageUrl ? "var(--hub-accent)" : "var(--hub-muted)",
          backgroundColor: "color-mix(in srgb, var(--hub-surface-alt) 50%, transparent)",
        }}
      >
        미리보기
      </button>
      {hovered && (
        <div
          className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 overflow-hidden rounded-2xl border shadow-2xl"
          style={{ borderColor: "var(--hub-outline)", backgroundColor: "var(--hub-surface)" }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="미리보기" className="h-36 w-36 object-contain p-2" />
          ) : (
            <div
              className="flex h-24 w-36 items-center justify-center text-xs"
              style={{ color: "var(--hub-muted)" }}
            >
              이미지 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilePicker({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => onChange(e.currentTarget.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition hover:opacity-90"
        style={{
          borderColor: "color-mix(in srgb, var(--hub-accent) 45%, var(--hub-border))",
          color: "var(--hub-accent)",
          backgroundColor: "color-mix(in srgb, var(--hub-accent-soft) 30%, transparent)",
          animation: "neon-aura 2.5s ease-in-out infinite",
        }}
      >
        파일 선택
      </button>
      {file && (
        <span
          className="truncate text-[11px]"
          style={{ color: "var(--hub-muted)", maxWidth: "88px" }}
          title={file.name}
        >
          {file.name}
        </span>
      )}
    </div>
  );
}

function CompactStat({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-1.5"
      style={{ borderColor: "var(--hub-border)" }}
    >
      <span
        className="shrink-0 text-xs"
        style={{ color: "var(--hub-muted)", minWidth: "88px" }}
      >
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-right text-sm outline-none"
        style={{ color: "var(--hub-text)" }}
      />
      {suffix && (
        <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--hub-muted)" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Image/Skill table layout ─────────────────────────────────────────────────

// 3-column: [이름] [설명] [파일선택+미리보기 묶음]
const COL_STYLE = {
  gridTemplateColumns: "minmax(160px, 1fr) minmax(0, 2fr) auto",
};

// 파일선택+미리보기 묶음 셀 (gap-2로 바짝 붙임)
function FileCell({
  file,
  previewUrl,
  onFileChange,
}: {
  file: File | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <FilePicker file={file} onChange={onFileChange} />
      <HoverPreview file={file} previewUrl={previewUrl} />
    </div>
  );
}

function ImageTableHeader() {
  return (
    <div
      className="grid items-center gap-3 pb-2 text-[11px] font-semibold uppercase tracking-wider"
      style={{ ...COL_STYLE, color: "var(--hub-muted)" }}
    >
      <span>이름</span>
      <span>설명</span>
      <span>이미지 파일</span>
    </div>
  );
}

function PortraitRow({
  file,
  previewUrl,
  onChange,
}: {
  file: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="border-t py-3" style={{ borderColor: "var(--hub-border)" }}>
      {/* 라벨 행 — 전체 너비 */}
      <span className="mb-1.5 block text-[10px]" style={{ color: "var(--hub-muted)" }}>
        캐릭터 초상화
      </span>
      {/* 인풋 행 */}
      <div className="grid items-center gap-3" style={COL_STYLE}>
        <span
          className="flex h-9 items-center rounded-xl border px-3 text-sm font-semibold"
          style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
        >
          초상화 이미지
        </span>
        <div />
        <FileCell file={file} previewUrl={previewUrl} onFileChange={onChange} />
      </div>
    </div>
  );
}

function SkillRow({
  rowLabel,
  nameValue,
  onNameChange,
  descValue,
  onDescChange,
  file,
  previewUrl,
  onFileChange,
}: {
  rowLabel: string;
  nameValue: string;
  onNameChange: (v: string) => void;
  descValue?: string;
  onDescChange?: (v: string) => void;
  file: File | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="border-t py-3" style={{ borderColor: "var(--hub-border)" }}>
      {/* 라벨 행 — 전체 너비로 늘어나 양쪽 인풋 위에 공통 헤더 역할 */}
      <span className="mb-1.5 block text-[10px]" style={{ color: "var(--hub-muted)" }}>
        {rowLabel}
      </span>
      {/* 인풋 행 — 같은 y축에서 시작하므로 두 input이 정렬됨 */}
      <div className="grid items-center gap-3" style={COL_STYLE}>
        <input
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={`${rowLabel} 이름`}
          className="h-9 w-full rounded-xl border bg-transparent px-3 text-sm outline-none placeholder:text-[10px] placeholder:opacity-25"
          style={{ borderColor: "var(--hub-border)", color: "var(--hub-text)" }}
        />
        <div>
          {onDescChange ? (
            <textarea
              value={descValue ?? ""}
              onChange={(e) => onDescChange(e.target.value)}
              placeholder="설명"
              className="h-9 w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[10px] placeholder:opacity-25"
              style={{ borderColor: "var(--hub-border)", color: "var(--hub-text)", resize: "none" }}
            />
          ) : null}
        </div>
        <FileCell file={file} previewUrl={previewUrl} onFileChange={onFileChange} />
      </div>
    </div>
  );
}

// ─── Shared form body ─────────────────────────────────────────────────────────

function CharacterFormBody({
  form,
  previewUrls,
  radioNamePrefix,
  onChange,
  onFileChange,
  onTranscendenceChange,
}: {
  form: CharacterFormState;
  previewUrls?: {
    portrait?: string | null;
    skillOne?: string | null;
    skillTwo?: string | null;
    passive?: string | null;
  };
  radioNamePrefix: string;
  onChange: <K extends keyof CharacterFormState>(key: K, value: CharacterFormState[K]) => void;
  onFileChange: (key: FileKey, file: File | null) => void;
  onTranscendenceChange: (
    index: number,
    key: "statKey" | "value",
    value: CharacterStatKey | string,
  ) => void;
}) {
  return (
    <div className="grid gap-6">
      {/* Image / Skill table (name row at top) */}
      <section
        className="overflow-x-auto rounded-[20px] border p-4"
        style={{ borderColor: "var(--hub-border)" }}
      >
        <div style={{ minWidth: "560px" }}>
          {/* 캐릭터 이름 row */}
          <div
            className="mb-4 flex items-center gap-3 border-b pb-4"
            style={{ borderColor: "var(--hub-border)" }}
          >
            <span
              className="w-[88px] shrink-0 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--hub-muted)" }}
            >
              캐릭터 이름
            </span>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="캐릭터 이름"
              className="h-9 flex-1 rounded-xl border bg-transparent px-3 text-sm outline-none placeholder:text-[10px] placeholder:opacity-25"
              style={{ borderColor: "var(--hub-border)", color: "var(--hub-text)" }}
            />
          </div>
          <ImageTableHeader />
          <PortraitRow
            file={form.portraitFile}
            previewUrl={previewUrls?.portrait}
            onChange={(file) => onFileChange("portraitFile", file)}
          />
          <SkillRow
            rowLabel="스킬 1"
            nameValue={form.skillOneName}
            onNameChange={(v) => onChange("skillOneName", v)}
            descValue={form.skillDescription}
            onDescChange={(v) => onChange("skillDescription", v)}
            file={form.skillOneImageFile}
            previewUrl={previewUrls?.skillOne}
            onFileChange={(file) => onFileChange("skillOneImageFile", file)}
          />
          <SkillRow
            rowLabel="스킬 2"
            nameValue={form.skillTwoName}
            onNameChange={(v) => onChange("skillTwoName", v)}
            descValue={form.skillTwoDescription}
            onDescChange={(v) => onChange("skillTwoDescription", v)}
            file={form.skillTwoImageFile}
            previewUrl={previewUrls?.skillTwo}
            onFileChange={(file) => onFileChange("skillTwoImageFile", file)}
          />
          <SkillRow
            rowLabel="패시브"
            nameValue={form.passiveName}
            onNameChange={(v) => onChange("passiveName", v)}
            descValue={form.passiveDescription}
            onDescChange={(v) => onChange("passiveDescription", v)}
            file={form.passiveImageFile}
            previewUrl={previewUrls?.passive}
            onFileChange={(file) => onFileChange("passiveImageFile", file)}
          />
        </div>
      </section>

      {/* 능력치 */}
      <section
        className="rounded-[24px] border p-4 md:p-5"
        style={{ borderColor: "var(--hub-border)" }}
      >
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
          능력치
        </p>

        {/* 역할 + 공격 타입 */}
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--hub-text)" }}>
              역할
            </span>
            <select
              value={form.role}
              onChange={(e) => onChange("role", e.target.value as CharacterRole)}
            >
              {CHARACTER_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--hub-text)" }}>
              공격 타입
            </span>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_ATTACK_TYPE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--hub-border)" }}
                >
                  <input
                    type="radio"
                    name={`${radioNamePrefix}-attack-type`}
                    checked={form.attackType === o.value}
                    onChange={() => onChange("attackType", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 수치 스탯 - 컴팩트 그리드 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <CompactStat
            label="공격력"
            value={form.attackPower}
            onChange={(v) => onChange("attackPower", v)}
          />
          <CompactStat
            label="방어력"
            value={form.defense}
            onChange={(v) => onChange("defense", v)}
          />
          <CompactStat
            label="생명력"
            value={form.health}
            onChange={(v) => onChange("health", v)}
          />
          <CompactStat
            label="속공"
            value={form.speed}
            onChange={(v) => onChange("speed", v)}
          />
          <CompactStat
            label="치명타 확률"
            value={form.criticalRate}
            onChange={(v) => onChange("criticalRate", v)}
            suffix="%"
          />
          <CompactStat
            label="치명피해"
            value={form.criticalDamage}
            onChange={(v) => onChange("criticalDamage", v)}
            suffix="%"
          />
          <CompactStat
            label="약점공격 확률"
            value={form.weakPointRate}
            onChange={(v) => onChange("weakPointRate", v)}
            suffix="%"
          />
          <CompactStat
            label="막기 확률"
            value={form.blockRate}
            onChange={(v) => onChange("blockRate", v)}
            suffix="%"
          />
          <CompactStat
            label="받는 피해 감소"
            value={form.damageReduction}
            onChange={(v) => onChange("damageReduction", v)}
            suffix="%"
          />
          <CompactStat
            label="효과 적중"
            value={form.effectAccuracy}
            onChange={(v) => onChange("effectAccuracy", v)}
            suffix="%"
          />
          <CompactStat
            label="효과 저항"
            value={form.effectResistance}
            onChange={(v) => onChange("effectResistance", v)}
            suffix="%"
          />
        </div>
      </section>

      {/* 초월 (6단계) */}
      <section
        className="rounded-[24px] border p-4 md:p-5"
        style={{ borderColor: "var(--hub-border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
          초월
        </p>
        <div className="mt-4 grid gap-3">
          {form.transcendence.map((entry, index) => (
            <div
              key={entry.level}
              className="grid gap-3 md:grid-cols-[72px_minmax(0,200px)_1fr]"
            >
              <div
                className="flex items-center rounded-2xl border px-3 py-2 text-sm font-semibold"
                style={{ borderColor: "var(--hub-border)" }}
              >
                {entry.level}단
              </div>
              <select
                value={entry.statKey}
                onChange={(e) =>
                  onTranscendenceChange(index, "statKey", e.target.value as CharacterStatKey)
                }
              >
                {CHARACTER_STAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                value={entry.value}
                onChange={(e) => onTranscendenceChange(index, "value", e.target.value)}
                placeholder="예: 공격력 + 30"
                className="h-9 w-full rounded-xl border bg-transparent px-3 text-sm outline-none placeholder:text-[10px] placeholder:opacity-25"
                style={{ borderColor: "var(--hub-border)", color: "var(--hub-text)" }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Character detail view (read-only) ───────────────────────────────────────

function CharacterDetailView({
  character,
  actions,
}: {
  character: AdminCharacter;
  actions?: React.ReactNode;
}) {
  const statRows = [
    { label: "공격 타입", value: getCharacterAttackTypeLabel(character.attackType) },
    { label: "공격력", value: String(character.attackPower) },
    { label: "방어력", value: String(character.defense) },
    { label: "생명력", value: String(character.health) },
    { label: "속공", value: String(character.speed) },
    { label: "치명타 확률", value: `${character.criticalRate}%` },
    { label: "치명피해", value: `${character.criticalDamage}%` },
    { label: "약점공격 확률", value: `${character.weakPointRate}%` },
    { label: "막기 확률", value: `${character.blockRate}%` },
    { label: "받는 피해 감소", value: `${character.damageReduction}%` },
    { label: "효과 적중", value: `${character.effectAccuracy}%` },
    { label: "효과 저항", value: `${character.effectResistance}%` },
  ];

  return (
    <div className="grid gap-4">
      {/* Row 1: 스킬1 | 스킬2 | 패시브 */}
      <div className="grid gap-4 md:grid-cols-3">
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--hub-border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--hub-accent)" }}>
            스킬 1
          </p>
          <div className="mt-3 flex items-start gap-3">
            <img
              src={character.skillOneImageUrl}
              alt={character.skillOneName}
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                {character.skillOneName}
              </p>
              {character.skillDescription && (
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--hub-muted)" }}>
                  {character.skillDescription}
                </p>
              )}
            </div>
          </div>
        </article>
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--hub-border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--hub-accent)" }}>
            스킬 2
          </p>
          <div className="mt-3 flex items-start gap-3">
            <img
              src={character.skillTwoImageUrl}
              alt={character.skillTwoName}
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                {character.skillTwoName}
              </p>
              {character.skillTwoDescription && (
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--hub-muted)" }}>
                  {character.skillTwoDescription}
                </p>
              )}
            </div>
          </div>
        </article>
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--hub-border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--hub-accent)" }}>
            패시브
          </p>
          <div className="mt-3 flex items-start gap-3">
            <img
              src={character.passiveImageUrl}
              alt={character.passiveName}
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                {character.passiveName}
              </p>
              {character.passiveDescription && (
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--hub-muted)" }}>
                  {character.passiveDescription}
                </p>
              )}
            </div>
          </div>
        </article>
      </div>
      {/* Row 2: 능력치 | 초월 + 액션 버튼 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--hub-border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--hub-accent)" }}>
            능력치
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {statRows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border px-3 py-2"
                style={{ borderColor: "var(--hub-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--hub-muted)" }}>
                  {row.label}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </article>
        {/* 오른쪽 컬럼: 초월(콘텐츠 높이) + 남은 공간에 버튼 */}
        <div className="flex flex-col gap-4">
          <article
            className="self-start rounded-2xl border p-4 w-full"
            style={{ borderColor: "var(--hub-border)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--hub-accent)" }}>
              초월
            </p>
            <div className="mt-3 grid gap-2">
              {character.transcendence.map((entry) => (
                <div
                  key={entry.level}
                  className="flex items-center justify-between rounded-2xl border px-3 py-2"
                  style={{ borderColor: "var(--hub-border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                    {entry.level}단
                  </span>
                  <span className="text-xs" style={{ color: "var(--hub-muted)" }}>
                    {getCharacterStatLabel(entry.statKey)} / {entry.value || "-"}
                  </span>
                </div>
              ))}
            </div>
          </article>
          {actions && (
            <div className="mt-auto flex justify-end gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Character editor (inline edit form) ─────────────────────────────────────

function CharacterEditor({
  form,
  character,
  saving,
  onChange,
  onFileChange,
  onTranscendenceChange,
  onSave,
  onCancel,
}: {
  form: CharacterFormState;
  character: AdminCharacter;
  saving: boolean;
  onChange: <K extends keyof CharacterFormState>(key: K, value: CharacterFormState[K]) => void;
  onFileChange: (key: FileKey, file: File | null) => void;
  onTranscendenceChange: (
    index: number,
    key: "statKey" | "value",
    value: CharacterStatKey | string,
  ) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="grid gap-6" onSubmit={onSave}>
      <CharacterFormBody
        form={form}
        previewUrls={{
          portrait: character.portraitUrl,
          skillOne: character.skillOneImageUrl,
          skillTwo: character.skillTwoImageUrl,
          passive: character.passiveImageUrl,
        }}
        radioNamePrefix={`edit-${character.id}`}
        onChange={onChange}
        onFileChange={onFileChange}
        onTranscendenceChange={onTranscendenceChange}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="admin-button-keep rounded-full border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="admin-link-chip admin-link-chip--primary admin-button-keep"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type CharacterManagerProps = {
  initialCharacters: AdminCharacter[];
  onStatus: (message: string) => void;
};

export function CharacterManager({ initialCharacters, onStatus }: CharacterManagerProps) {
  const [tab, setTab] = useState<CharacterManagerTab>("manage");
  const [characters, setCharacters] = useState(initialCharacters);
  const [createForm, setCreateForm] = useState<CharacterFormState>(createEmptyCharacterForm);
  const [expandedId, setExpandedId] = useState<number | null>(initialCharacters[0]?.id ?? null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CharacterFormState | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function updateCreateForm<K extends keyof CharacterFormState>(
    key: K,
    value: CharacterFormState[K],
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm<K extends keyof CharacterFormState>(
    key: K,
    value: CharacterFormState[K],
  ) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateTranscendence(
    target: "create" | "edit",
    index: number,
    key: "statKey" | "value",
    value: CharacterStatKey | string,
  ) {
    const update = (entries: CharacterTranscendenceEntry[]) =>
      entries.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
    if (target === "create") {
      setCreateForm((prev) => ({ ...prev, transcendence: update(prev.transcendence) }));
      return;
    }
    setEditForm((prev) => (prev ? { ...prev, transcendence: update(prev.transcendence) } : prev));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    onStatus("");
    try {
      const formData = new FormData();
      appendCharacterFormData(formData, createForm);
      const response = await fetch("/api/admin/characters", { method: "POST", body: formData });
      const data = await readJson<{ character: AdminCharacter; message?: string }>(response);
      setCharacters((prev) =>
        [...prev, data.character].sort((a, b) => a.name.localeCompare(b.name, "ko")),
      );
      setExpandedId(data.character.id);
      setCreateForm(createEmptyCharacterForm());
      onStatus(data.message ?? `${data.character.name} 캐릭터를 등록했습니다.`);
      setTab("list");
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "캐릭터 등록에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(character: AdminCharacter) {
    setExpandedId(character.id);
    setEditingId(character.id);
    setEditForm(createFormFromCharacter(character));
  }

  async function handleSave(characterId: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm) return;
    setSavingId(characterId);
    onStatus("");
    try {
      const formData = new FormData();
      appendCharacterFormData(formData, editForm);
      const response = await fetch(`/api/admin/characters/${characterId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await readJson<{ character: AdminCharacter; message?: string }>(response);
      setCharacters((prev) =>
        updateCharacterInList(prev, data.character).sort((a, b) =>
          a.name.localeCompare(b.name, "ko"),
        ),
      );
      setEditingId(null);
      setEditForm(null);
      onStatus(data.message ?? `${data.character.name} 캐릭터 정보를 저장했습니다.`);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "캐릭터 저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeletingId(deleteModal.id);
    onStatus("");
    try {
      const response = await fetch(`/api/admin/characters/${deleteModal.id}`, {
        method: "DELETE",
      });
      const data = await readJson<{ message?: string }>(response);
      setCharacters((prev) => prev.filter((c) => c.id !== deleteModal.id));
      if (expandedId === deleteModal.id) setExpandedId(null);
      if (editingId === deleteModal.id) {
        setEditingId(null);
        setEditForm(null);
      }
      onStatus(data.message ?? `${deleteModal.name} 캐릭터를 삭제했습니다.`);
      setDeleteModal(null);
    } catch (caught) {
      onStatus(caught instanceof Error ? caught.message : "캐릭터 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-panel relative overflow-hidden rounded-[24px] p-5 md:p-6">
      {/* Header */}
      <header className="mb-6 border-b pb-5" style={{ borderColor: "var(--hub-border)" }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-accent)" }}
        >
          캐릭터 등록
        </p>
        <h2
          className="mt-2 text-2xl font-black uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-text)" }}
        >
          캐릭터 관리
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>
          캐릭터 정보를 생성하고 능력치, 스킬, 패시브, 초월 데이터를 한 화면에서 관리합니다.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-8">
        {(
          [
            { id: "manage" as const, label: "캐릭터 관리" },
            { id: "list" as const, label: `캐릭터 리스트 (${characters.length})` },
          ] as const
        ).map((tabItem) => {
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className="relative pb-3 text-sm font-semibold tracking-wide transition-all duration-200"
              style={{
                color: isActive ? "var(--hub-accent)" : "var(--hub-muted)",
                textShadow: isActive
                  ? "0 0 10px var(--hub-accent), 0 0 24px color-mix(in srgb, var(--hub-accent) 45%, transparent)"
                  : "none",
              }}
            >
              {tabItem.label}
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-200"
                style={{
                  backgroundColor: isActive ? "var(--hub-accent)" : "transparent",
                  boxShadow: isActive
                    ? "0 0 6px var(--hub-accent), 0 0 14px color-mix(in srgb, var(--hub-accent) 55%, transparent)"
                    : "none",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Tab: 캐릭터 관리 (Create form) */}
      {tab === "manage" && (
        <form className="grid gap-6" onSubmit={handleCreate}>
          <CharacterFormBody
            form={createForm}
            radioNamePrefix="create"
            onChange={updateCreateForm}
            onFileChange={updateCreateForm}
            onTranscendenceChange={(index, key, value) =>
              updateTranscendence("create", index, key, value)
            }
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="admin-link-chip admin-link-chip--primary admin-button-keep"
            >
              {creating ? "등록 중..." : "캐릭터 등록"}
            </button>
          </div>
        </form>
      )}

      {/* Tab: 캐릭터 리스트 */}
      {tab === "list" && (
        <div className="grid gap-3">
          {characters.length === 0 ? (
            <div
              className="rounded-2xl border px-4 py-6 text-sm"
              style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
            >
              아직 등록된 캐릭터가 없습니다.
            </div>
          ) : (
            characters.map((character) => {
              const expanded = expandedId === character.id;
              const editing = editingId === character.id && editForm;
              return (
                <article
                  key={character.id}
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: expanded ? "var(--hub-outline)" : "var(--hub-border)",
                    backgroundColor:
                      "color-mix(in srgb, var(--hub-surface-alt) 72%, transparent)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === character.id ? null : character.id))
                    }
                    className="flex w-full items-center gap-4 text-left"
                  >
                    <img
                      src={character.portraitUrl}
                      alt={character.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold" style={{ color: "var(--hub-text)" }}>
                        {character.name}
                      </p>
                    </div>
                    <RoleBadge role={character.role} roleSymbolUrl={character.roleSymbolUrl} />
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition"
                      style={{
                        borderColor: "var(--hub-border)",
                        color: "var(--hub-muted)",
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ↓
                    </span>
                  </button>
                  {expanded ? (
                    <div
                      className="mt-5 border-t pt-5"
                      style={{ borderColor: "var(--hub-border)" }}
                    >
                      {editing ? (
                        <CharacterEditor
                          form={editForm}
                          character={character}
                          saving={savingId === character.id}
                          onChange={updateEditForm}
                          onFileChange={updateEditForm}
                          onTranscendenceChange={(index, key, value) =>
                            updateTranscendence("edit", index, key, value)
                          }
                          onSave={(event) => handleSave(character.id, event)}
                          onCancel={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                        />
                      ) : (
                        <CharacterDetailView
                          character={character}
                          actions={
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(character)}
                                className="admin-button-keep rounded-full border px-4 py-2 text-sm font-semibold"
                                style={{
                                  borderColor: "var(--hub-outline)",
                                  color: "var(--hub-accent)",
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteModal({ id: character.id, name: character.name })
                                }
                                className="admin-button-keep rounded-full border px-4 py-2 text-sm font-semibold"
                                style={{
                                  borderColor: "var(--hub-danger-border)",
                                  color: "var(--hub-danger-text)",
                                }}
                              >
                                삭제
                              </button>
                            </>
                          }
                        />
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Delete modal */}
      {deleteModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="mx-4 w-full max-w-md overflow-hidden rounded-[24px] border shadow-2xl"
            style={{
              borderColor: "var(--hub-danger-border)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--hub-surface) 94%, white 6%) 0%, var(--hub-surface) 100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-[linear-gradient(90deg,#ef4444,#f87171)]" />
            <div className="px-6 py-5">
              <p className="text-sm font-bold" style={{ color: "var(--hub-danger-text)" }}>
                캐릭터 삭제 확인
              </p>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--hub-muted)" }}
              >
                <span style={{ color: "var(--hub-text)" }}>{deleteModal.name}</span> 캐릭터를
                실제로 삭제할까요? 삭제 후에는 복구할 수 없습니다.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="admin-button-keep rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: "var(--hub-border)", color: "var(--hub-muted)" }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletingId === deleteModal.id}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--hub-danger-text) 88%, #ef4444 12%)",
                  }}
                >
                  {deletingId === deleteModal.id ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
