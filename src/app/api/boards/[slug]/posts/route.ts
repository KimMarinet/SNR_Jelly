import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSystemBoards } from "@/lib/system-boards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await ensureSystemBoards();

  const board = await prisma.board.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
    },
  });

  if (!board) {
    return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  const posts = await prisma.post.findMany({
    where: {
      boardId: board.id,
      isPublished: true,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      likeCount: true,
      viewCount: true,
      createdAt: true,
      author: {
        select: { email: true, nickname: true },
      },
    },
  });

  return NextResponse.json({ board, posts });
}
