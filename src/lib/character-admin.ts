import type {
  CharacterAttackType,
  CharacterRole,
} from "@/generated/prisma";

export const CHARACTER_ROLE_OPTIONS: Array<{
  value: CharacterRole;
  label: string;
}> = [
  { value: "ATTACKER", label: "공격형" },
  { value: "MAGIC", label: "마법형" },
  { value: "DEFENDER", label: "방어형" },
  { value: "SUPPORT", label: "지원형" },
  { value: "UNIVERSAL", label: "만능형" },
];

export const CHARACTER_ATTACK_TYPE_OPTIONS: Array<{
  value: CharacterAttackType;
  label: string;
}> = [
  { value: "PHYSICAL", label: "물리" },
  { value: "MAGIC", label: "마법" },
];

export const CHARACTER_STAT_OPTIONS = [
  { value: "attackPower", label: "공격력" },
  { value: "defense", label: "방어력" },
  { value: "health", label: "생명력" },
  { value: "speed", label: "속공" },
  { value: "criticalRate", label: "치명타 확률" },
  { value: "criticalDamage", label: "치명피해" },
  { value: "weakPointRate", label: "약점공격 확률" },
  { value: "blockRate", label: "막기 확률" },
  { value: "damageReduction", label: "받는 피해 감소" },
  { value: "effectAccuracy", label: "효과 적중" },
  { value: "effectResistance", label: "효과 저항" },
] as const;

export type CharacterStatKey = (typeof CHARACTER_STAT_OPTIONS)[number]["value"];

export type CharacterTranscendenceEntry = {
  level: number;
  statKey: CharacterStatKey;
  value: string;
};

export function getCharacterRoleLabel(role: CharacterRole): string {
  return CHARACTER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function getCharacterAttackTypeLabel(type: CharacterAttackType): string {
  return CHARACTER_ATTACK_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getCharacterStatLabel(statKey: CharacterStatKey): string {
  return CHARACTER_STAT_OPTIONS.find((option) => option.value === statKey)?.label ?? statKey;
}

export function getCharacterRoleSymbolUrl(role: CharacterRole): string {
  const slugMap: Record<CharacterRole, string> = {
    ATTACKER: "attacker",
    MAGIC: "magic",
    DEFENDER: "defender",
    SUPPORT: "support",
    UNIVERSAL: "universal",
  };

  return `/images/roles/${slugMap[role]}-symbol.png`;
}

export function createDefaultTranscendenceEntries(): CharacterTranscendenceEntry[] {
  return Array.from({ length: 6 }, (_, index) => ({
    level: index + 1,
    statKey: "attackPower",
    value: "",
  }));
}

export function normalizeTranscendenceEntries(
  input: unknown,
): CharacterTranscendenceEntry[] {
  if (!Array.isArray(input)) {
    return createDefaultTranscendenceEntries();
  }

  const defaults = createDefaultTranscendenceEntries();
  return defaults.map((entry, index) => {
    const candidate = input[index];
    if (!candidate || typeof candidate !== "object") {
      return entry;
    }

    const statKey = "statKey" in candidate ? candidate.statKey : undefined;
    const value = "value" in candidate ? candidate.value : undefined;

    const isValidStatKey = CHARACTER_STAT_OPTIONS.some((option) => option.value === statKey);

    return {
      level: entry.level,
      statKey: isValidStatKey ? (statKey as CharacterStatKey) : entry.statKey,
      value: typeof value === "string" ? value : "",
    };
  });
}
