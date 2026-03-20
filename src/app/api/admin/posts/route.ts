import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
}

function parseScope(scope: string | null): "active" | "trash" | "all" {
  if (scope === "active" || scope === "trash") {
    return scope;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const boardIdRaw = request.nextUrl.searchParams.get("boardId");
  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const boardId = Number(boardIdRaw);

  if (!Number.isInteger(boardId) || boardId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 boardId입니다." }, { status: 400 });
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
      isPublished: true,
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
