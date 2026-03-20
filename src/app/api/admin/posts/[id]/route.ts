import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type UpdatePostBody = {
  action?: "toggle-publish" | "trash" | "restore";
  isPublished?: boolean;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "유효하지 않은 게시글 ID입니다." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePostBody;

  if (body.action === "toggle-publish") {
    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { message: "isPublished 값이 필요합니다." },
        { status: 400 },
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isPublished: body.isPublished },
      select: { id: true, isPublished: true, deletedAt: true },
    });

    return NextResponse.json({ post: updatedPost, message: "공개 상태를 변경했습니다." });
  }

  if (body.action === "trash" || body.action === "restore") {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { deletedAt: body.action === "trash" ? new Date() : null },
      select: { id: true, deletedAt: true },
    });

    return NextResponse.json({
      post: updatedPost,
      message: body.action === "trash" ? "게시글을 휴지통으로 이동했습니다." : "게시글을 복구했습니다.",
    });
  }

  return NextResponse.json({ message: "지원하지 않는 작업입니다." }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "유효하지 않은 게시글 ID입니다." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!post.deletedAt) {
    return NextResponse.json(
      { message: "휴지통에 있는 게시글만 영구 삭제할 수 있습니다." },
      { status: 400 },
    );
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ message: "게시글이 영구 삭제되었습니다." });
}
