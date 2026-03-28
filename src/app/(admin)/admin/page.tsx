import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { characterSelect, toAdminCharacter } from "@/lib/character-admin-server";
import { getAdminHeroBackgroundUrl } from "@/lib/admin-preferences";
import { prisma } from "@/lib/prisma";
import { attachSystemProtection, ensureSystemBoards } from "@/lib/system-boards";
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

  await ensureSystemBoards();

  const [activeBoardsRaw, inactiveBoardsRaw, charactersRaw, landingVideos, adminHeroBackgroundUrl] =
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
      prisma.character.findMany({
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: characterSelect,
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
      getAdminHeroBackgroundUrl(Number(session.user.id)),
    ]);
  const [activeBoards, inactiveBoards] = await Promise.all([
    attachSystemProtection(activeBoardsRaw),
    attachSystemProtection(inactiveBoardsRaw),
  ]);
  const characters = charactersRaw.map(toAdminCharacter);

  return (
    <AdminControlPanel
      initialActiveBoards={activeBoards}
      initialInactiveBoards={inactiveBoards}
      initialCharacters={characters}
      initialLandingVideos={landingVideos}
      initialHeroBackgroundUrl={adminHeroBackgroundUrl}
    />
  );
}
