import type { Metadata } from "next";
import { hasAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminControlPanel } from "./_components/admin-control-panel";
import { AdminLoginForm } from "./_components/admin-login-form";

export const metadata: Metadata = {
  title: "관리자 패널",
  description: "파일, 게시판, 게시글 운영 관리 패널",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authorized = await hasAdminSession();

  if (!authorized) {
    return <AdminLoginForm />;
  }

  const [activeBoards, inactiveBoards, activeAssets, trashedAssets] =
    await Promise.all([
      prisma.board.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          isActive: true,
          _count: {
            select: { posts: true },
          },
        },
      }),
      prisma.board.findMany({
        where: { isActive: false },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          isActive: true,
          _count: {
            select: { posts: true },
          },
        },
      }),
      prisma.asset.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          category: true,
          originalName: true,
          storedName: true,
          mimeType: true,
          size: true,
          publicUrl: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.asset.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        select: {
          id: true,
          category: true,
          originalName: true,
          storedName: true,
          mimeType: true,
          size: true,
          publicUrl: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

  return (
    <AdminControlPanel
      initialActiveBoards={activeBoards}
      initialInactiveBoards={inactiveBoards}
      initialActiveAssets={activeAssets}
      initialTrashedAssets={trashedAssets}
    />
  );
}
