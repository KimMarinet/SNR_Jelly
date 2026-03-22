import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

type UpdatePostBody = {
  action?: "toggle-publish" | "trash" | "restore" | "toggle-pin";
  isPublished?: boolean;
  isPinned?: boolean;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, board: { select: { slug: true } } },
  });

  if (!post) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePostBody;

  if (body.action === "toggle-publish") {
    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { message: "isPublished is required." },
        { status: 400 },
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isPublished: body.isPublished },
      select: { id: true, isPublished: true, deletedAt: true },
    });
    revalidatePath(`/board/${post.board.slug}`);
    revalidatePath(`/board/${post.board.slug}/${id}`);

    return NextResponse.json({
      post: updatedPost,
      message: "Post visibility updated.",
    });
  }

  if (body.action === "toggle-pin") {
    if (typeof body.isPinned !== "boolean") {
      return NextResponse.json({ message: "isPinned is required." }, { status: 400 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isPinned: body.isPinned },
      select: { id: true, isPinned: true },
    });
    // 브리핑 섹션이 있는 페이지 전체 재검증
    revalidatePath("/");
    revalidatePath("/lounge");
    revalidatePath(`/board/${post.board.slug}`);

    return NextResponse.json({
      post: updatedPost,
      message: body.isPinned ? "공지 고정되었습니다." : "공지 고정 해제되었습니다.",
    });
  }

  if (body.action === "trash" || body.action === "restore") {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { deletedAt: body.action === "trash" ? new Date() : null },
      select: { id: true, deletedAt: true },
    });
    revalidatePath(`/board/${post.board.slug}`);
    revalidatePath(`/board/${post.board.slug}/${id}`);

    return NextResponse.json({
      post: updatedPost,
      message: body.action === "trash" ? "Post moved to trash." : "Post restored.",
    });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, board: { select: { slug: true } } },
  });

  if (!post) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  if (!post.deletedAt) {
    return NextResponse.json(
      { message: "Only trashed posts can be permanently deleted." },
      { status: 400 },
    );
  }

  await prisma.post.delete({ where: { id } });
  revalidatePath(`/board/${post.board.slug}`);
  revalidatePath(`/board/${post.board.slug}/${id}`);
  return NextResponse.json({ message: "Post deleted permanently." });
}
