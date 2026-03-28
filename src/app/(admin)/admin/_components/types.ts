import type {
  AssetCategory,
  CharacterAttackType,
  CharacterRole,
} from "@/generated/prisma";
import type { CharacterTranscendenceEntry } from "@/lib/character-admin";

export type AdminBoard = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  isActive: boolean;
  isAdminWriteOnly: boolean;
  isSystemProtected: boolean;
  _count?: { posts: number };
};

export type AdminAsset = {
  id: number;
  category: AssetCategory;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  publicUrl: string;
  deletedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type AdminPost = {
  id: number;
  boardId: number;
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    email: string;
  };
};

export type AdminLandingVideo = {
  id: number;
  title: string | null;
  youtubeId: string;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type AdminHeroBackgroundPreference = {
  backgroundImageUrl: string | null;
};

export type AdminCharacter = {
  id: number;
  name: string;
  portraitUrl: string;
  skillOneName: string;
  skillOneImageUrl: string;
  skillTwoName: string;
  skillTwoImageUrl: string;
  skillDescription: string;
  skillTwoDescription: string;
  passiveName: string;
  passiveImageUrl: string;
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
  createdAt: string | Date;
  updatedAt: string | Date;
};
