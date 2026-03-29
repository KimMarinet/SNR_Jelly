import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { postCombinationSchema } from "@/lib/post-combination";
import { getCurrentUserAuth } from "@/lib/session";

const createPostSchema = z.object({
  boardId: z.number().int().positive(),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim(),
  combinationData: postCombinationSchema.optional(),
  isPinned: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUserAuth();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid post input." }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { id: parsed.data.boardId },
    select: { id: true, slug: true, isActive: true, isAdminWriteOnly: true },
  });
  if (!board || !board.isActive) {
    return NextResponse.json({ message: "Board not available." }, { status: 400 });
  }

  if (board.isAdminWriteOnly && user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Only admins can write posts in this board." },
      { status: 403 },
    );
  }

  const post = await prisma.post.create({
    data: {
      boardId: parsed.data.boardId,
      authorId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      combinationData: parsed.data.combinationData ?? undefined,
      isPublished: true,
      isPinned: user.role === "ADMIN" ? (parsed.data.isPinned ?? false) : false,
    },
    select: {
      id: true,
      boardId: true,
      title: true,
      isPublished: true,
      createdAt: true,
    },
  });

  revalidatePath(`/board/${board.slug}`);
  revalidatePath(`/board/${board.slug}/${post.id}`);

  return NextResponse.json({ post, boardSlug: board.slug }, { status: 201 });
}
