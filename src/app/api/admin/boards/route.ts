import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type CreateBoardBody = {
  title?: string;
  slug?: string;
  description?: string | null;
  order?: number;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

function parseBoardStatusParam(value: string | null): "all" | "active" | "inactive" {
  if (value === "active" || value === "inactive") {
    return value;
  }
  return "all";
}

function parseCreateBoardBody(body: CreateBoardBody) {
  const title = body.title?.trim() ?? "";
  const slug = normalizeSlug(body.slug ?? "");

  if (!title) {
    return { ok: false as const, message: "게시판 이름은 필수입니다." };
  }

  if (!slug || !isValidSlug(slug)) {
    return {
      ok: false as const,
      message: "슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.",
    };
  }

  return {
    ok: true as const,
    data: {
      title,
      slug,
      description: body.description?.trim() || null,
      order: Number.isFinite(body.order) ? Number(body.order) : 0,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const status = parseBoardStatusParam(request.nextUrl.searchParams.get("status"));

  const boards = await prisma.board.findMany({
    where:
      status === "all"
        ? undefined
        : {
            isActive: status === "active",
          },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      isActive: true,
      _count: {
        select: { posts: true },
      },
    },
  });

  return NextResponse.json({ boards });
}

export async function POST(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateBoardBody;
  const parsed = parseCreateBoardBody(body);

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  try {
    const board = await prisma.board.create({
      data: {
        ...parsed.data,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        order: true,
        isActive: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "동일한 슬러그의 게시판이 이미 존재합니다." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "게시판 생성에 실패했습니다." }, { status: 500 });
  }
}
