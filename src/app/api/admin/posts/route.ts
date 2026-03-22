import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function parseScope(scope: string | null): "active" | "trash" | "all" {
  if (scope === "active" || scope === "trash") {
    return scope;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const boardIdRaw = request.nextUrl.searchParams.get("boardId");
  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const boardId = Number(boardIdRaw);

  if (!Number.isInteger(boardId) || boardId <= 0) {
    return NextResponse.json({ message: "Invalid boardId." }, { status: 400 });
  }

  const posts = await prisma.post.findMany({
    where: {
      boardId,
      ...(scope === "active"
        ? { deletedAt: null }
        : scope === "trash"
          ? { deletedAt: { not: null } }
          : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      boardId: true,
      title: true,
      content: true,
      isPublished: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      author: {
        select: { email: true },
      },
    },
  });

  return NextResponse.json({ posts });
}
