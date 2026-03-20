import type { AssetCategory } from "@prisma/client";

export type AdminBoard = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  isActive: boolean;
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
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    email: string;
  };
};
