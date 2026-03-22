import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminControlPanel } from "./_components/admin-control-panel";

export const metadata: Metadata = {
  title: "관리자 패널",
  description: "파일, 게시판, 게시글 운영 관리 패널",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/lounge");
  }

  const [activeBoards, inactiveBoards, activeAssets, trashedAssets, landingVideos] =
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
          isAdminWriteOnly: true,
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
          isAdminWriteOnly: true,
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
      prisma.landingVideo.findMany({
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          youtubeId: true,
          order: true,
          isActive: true,
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
      initialLandingVideos={landingVideos}
    />
  );
}
