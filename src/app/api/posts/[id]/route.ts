import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAuth } from "@/lib/session";

const updatePostSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim(),
  isPinned: z.boolean().optional(),
});

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUserAuth();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const postId = parseId(rawId);
  if (!postId) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      board: { select: { slug: true, isAdminWriteOnly: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const canEdit =
    user.role === "ADMIN" ||
    (!existing.board.isAdminWriteOnly && existing.authorId === user.id);
  if (!canEdit) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid post update input." }, { status: 400 });
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      isPublished: true,
      ...(user.role === "ADMIN" && parsed.data.isPinned !== undefined
        ? { isPinned: parsed.data.isPinned }
        : {}),
    },
    select: { id: true, title: true, isPublished: true, updatedAt: true },
  });

  revalidatePath(`/board/${existing.board.slug}`);
  revalidatePath(`/board/${existing.board.slug}/${post.id}`);

  return NextResponse.json({ post, boardSlug: existing.board.slug });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUserAuth();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const postId = parseId(rawId);
  if (!postId) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      board: { select: { slug: true, isAdminWriteOnly: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const canDelete =
    user.role === "ADMIN" ||
    (!existing.board.isAdminWriteOnly && existing.authorId === user.id);
  if (!canDelete) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath(`/board/${existing.board.slug}`);
  revalidatePath(`/board/${existing.board.slug}/${postId}`);
  return NextResponse.json({ message: "Post deleted.", boardSlug: existing.board.slug });
}
