import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAuth } from "@/lib/session";

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const postId = parseId(rawId);
  if (!postId) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
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

  return NextResponse.json({ comments });
}

export async function POST(
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

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid comment input." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, isPublished: true, authorId: true, deletedAt: true },
  });

  if (!post || post.deletedAt) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const canAccess = post.isPublished || user.role === "ADMIN" || post.authorId === user.id;
  if (!canAccess) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: user.id,
      content: parsed.data.content,
    },
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

  return NextResponse.json({ comment }, { status: 201 });
}
