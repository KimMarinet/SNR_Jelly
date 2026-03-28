import type {
  Character,
  CharacterAttackType,
  CharacterRole,
  Prisma,
} from "@/generated/prisma";
import {
  CHARACTER_ATTACK_TYPE_OPTIONS,
  CHARACTER_ROLE_OPTIONS,
  CHARACTER_STAT_OPTIONS,
  getCharacterRoleSymbolUrl,
  normalizeTranscendenceEntries,
  type CharacterStatKey,
  type CharacterTranscendenceEntry,
} from "@/lib/character-admin";
import type { AdminCharacter } from "@/app/(admin)/admin/_components/types";

export const characterSelect = {
  id: true,
  name: true,
  portraitUrl: true,
  skillOneName: true,
  skillOneImageUrl: true,
  skillTwoName: true,
  skillTwoImageUrl: true,
  skillDescription: true,
  skillTwoDescription: true,
  passiveName: true,
  passiveImageUrl: true,
  passiveDescription: true,
  role: true,
  roleSymbolUrl: true,
  attackType: true,
  attackPower: true,
  defense: true,
  health: true,
  speed: true,
  criticalRate: true,
  criticalDamage: true,
  weakPointRate: true,
  blockRate: true,
  damageReduction: true,
  effectAccuracy: true,
  effectResistance: true,
  transcendence: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CharacterSelect;

export type CharacterPayload = {
  name: string;
  skillOneName: string;
  skillTwoName: string;
  skillDescription: string;
  skillTwoDescription: string;
  passiveName: string;
  passiveDescription: string;
  role: CharacterRole;
  roleSymbolUrl: string;
  attackType: CharacterAttackType;
  attackPower: number;
  defense: number;
  health: number;
  speed: number;
  criticalRate: number;
  criticalDamage: number;
  weakPointRate: number;
  blockRate: number;
  damageReduction: number;
  effectAccuracy: number;
  effectResistance: number;
  transcendence: CharacterTranscendenceEntry[];
};

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return trimmed;
}

function readRequiredInt(formData: FormData, key: string): number {
  const raw = readRequiredString(formData, key);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} 값은 0 이상의 정수여야 합니다.`);
  }
  return value;
}

function parseRole(value: string): CharacterRole {
  const match = CHARACTER_ROLE_OPTIONS.find((option) => option.value === value);
  if (!match) {
    throw new Error("유효한 역할을 선택해 주세요.");
  }
  return match.value;
}

function parseAttackType(value: string): CharacterAttackType {
  const match = CHARACTER_ATTACK_TYPE_OPTIONS.find((option) => option.value === value);
  if (!match) {
    throw new Error("유효한 공격 타입을 선택해 주세요.");
  }
  return match.value;
}

function parseTranscendence(value: string): CharacterTranscendenceEntry[] {
  let parsed: unknown = [];

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("초월 데이터 형식이 올바르지 않습니다.");
  }

  const normalized = normalizeTranscendenceEntries(parsed);
  normalized.forEach((entry) => {
    const hasStat = CHARACTER_STAT_OPTIONS.some((option) => option.value === entry.statKey);
    if (!hasStat) {
      throw new Error("초월 능력치 선택 값이 올바르지 않습니다.");
    }
  });

  return normalized;
}

export function parseCharacterFormData(formData: FormData): CharacterPayload {
  const role = parseRole(readRequiredString(formData, "role"));

  return {
    name: readRequiredString(formData, "name"),
    skillOneName: readRequiredString(formData, "skillOneName"),
    skillTwoName: readRequiredString(formData, "skillTwoName"),
    skillDescription: (formData.get("skillDescription") as string | null)?.trim() ?? "",
    skillTwoDescription: (formData.get("skillTwoDescription") as string | null)?.trim() ?? "",
    passiveName: readRequiredString(formData, "passiveName"),
    passiveDescription: (formData.get("passiveDescription") as string | null)?.trim() ?? "",
    role,
    roleSymbolUrl: getCharacterRoleSymbolUrl(role),
    attackType: parseAttackType(readRequiredString(formData, "attackType")),
    attackPower: readRequiredInt(formData, "attackPower"),
    defense: readRequiredInt(formData, "defense"),
    health: readRequiredInt(formData, "health"),
    speed: readRequiredInt(formData, "speed"),
    criticalRate: readRequiredInt(formData, "criticalRate"),
    criticalDamage: readRequiredInt(formData, "criticalDamage"),
    weakPointRate: readRequiredInt(formData, "weakPointRate"),
    blockRate: readRequiredInt(formData, "blockRate"),
    damageReduction: readRequiredInt(formData, "damageReduction"),
    effectAccuracy: readRequiredInt(formData, "effectAccuracy"),
    effectResistance: readRequiredInt(formData, "effectResistance"),
    transcendence: parseTranscendence(readRequiredString(formData, "transcendence")),
  };
}

export function readImageFile(
  formData: FormData,
  key: string,
  required: boolean,
): File | null {
  const value = formData.get(key);

  if (value == null || value === "") {
    if (required) {
      throw new Error(`${key} 이미지가 필요합니다.`);
    }
    return null;
  }

  if (!(value instanceof File)) {
    throw new Error(`${key} 이미지 형식이 올바르지 않습니다.`);
  }

  if (required && value.size === 0) {
    throw new Error(`${key} 이미지가 필요합니다.`);
  }

  return value.size > 0 ? value : null;
}

export function toAdminCharacter(
  character: Pick<Character, keyof typeof characterSelect>,
): AdminCharacter {
  return {
    ...character,
    skillDescription: character.skillDescription ?? "",
    skillTwoDescription: character.skillTwoDescription ?? "",
    passiveDescription: character.passiveDescription ?? "",
    transcendence: normalizeTranscendenceEntries(character.transcendence),
  };
}

export function getCharacterStatValue(
  payload: CharacterPayload,
  statKey: CharacterStatKey,
): number {
  return payload[statKey];
}
