import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAuth } from "@/lib/session";

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await tx.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      });
    } else {
      await tx.postLike.create({
        data: {
          postId,
          userId: user.id,
        },
      });
    }

    const likeCount = await tx.postLike.count({
      where: { postId },
    });

    await tx.post.update({
      where: { id: postId },
      data: { likeCount },
    });

    return {
      liked: !existing,
      likeCount,
    };
  });

  return NextResponse.json(result);
}
