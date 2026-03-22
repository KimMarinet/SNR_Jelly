import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAuth } from "@/lib/session";

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const user = await getCurrentUserAuth();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id: rawPostId, commentId: rawCommentId } = await params;
  const postId = parseId(rawPostId);
  const commentId = parseId(rawCommentId);
  if (!postId || !commentId) {
    return NextResponse.json({ message: "Invalid ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid comment update input." }, { status: 400 });
  }

  const existing = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    select: { id: true, authorId: true },
  });
  if (!existing) {
    return NextResponse.json({ message: "Comment not found." }, { status: 404 });
  }

  const canManage = existing.authorId === user.id || user.role === "ADMIN";
  if (!canManage) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const comment = await prisma.comment.update({
    where: { id: existing.id },
    data: { content: parsed.data.content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          email: true,
          nickname: true,
        },
      },
    },
  });

  return NextResponse.json({ comment });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const user = await getCurrentUserAuth();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id: rawPostId, commentId: rawCommentId } = await params;
  const postId = parseId(rawPostId);
  const commentId = parseId(rawCommentId);
  if (!postId || !commentId) {
    return NextResponse.json({ message: "Invalid ID." }, { status: 400 });
  }

  const existing = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    select: { id: true, authorId: true },
  });
  if (!existing) {
    return NextResponse.json({ message: "Comment not found." }, { status: 404 });
  }

  const canManage = existing.authorId === user.id || user.role === "ADMIN";
  if (!canManage) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: existing.id } });
  return NextResponse.json({ message: "Comment deleted." });
}
