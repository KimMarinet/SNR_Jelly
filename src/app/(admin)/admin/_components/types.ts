import type { AssetCategory } from "@/generated/prisma";

export type AdminBoard = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  isActive: boolean;
  isAdminWriteOnly: boolean;
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
