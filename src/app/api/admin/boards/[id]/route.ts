import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type UpdateBoardBody = {
  action?: "deactivate" | "restore";
  title?: string;
  slug?: string;
  description?: string | null;
  order?: number;
};

type HardDeleteBoardBody = {
  confirmBoardTitle?: string;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
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
    return NextResponse.json({ message: "유효하지 않은 게시판 ID입니다." }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!board) {
    return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateBoardBody;

  if (body.action === "deactivate" || body.action === "restore") {
    const updatedBoard = await prisma.board.update({
      where: { id },
      data: { isActive: body.action === "restore" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        order: true,
        isActive: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({
      board: updatedBoard,
      message: body.action === "restore" ? "게시판을 복구했습니다." : "게시판을 비활성화했습니다.",
    });
  }

  const data: {
    title?: string;
    slug?: string;
    description?: string | null;
    order?: number;
  } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ message: "게시판 이름은 필수입니다." }, { status: 400 });
    }
    data.title = title;
  }

  if (typeof body.slug === "string") {
    const slug = normalizeSlug(body.slug);
    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json(
        { message: "슬러그 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    data.slug = slug;
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" ? body.description.trim() || null : null;
  }

  if (body.order !== undefined) {
    data.order = Number.isFinite(body.order) ? Number(body.order) : 0;
  }

  try {
    const updatedBoard = await prisma.board.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        order: true,
        isActive: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ board: updatedBoard, message: "게시판이 저장되었습니다." });
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
    return NextResponse.json({ message: "게시판 수정에 실패했습니다." }, { status: 500 });
  }
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
    return NextResponse.json({ message: "유효하지 않은 게시판 ID입니다." }, { status: 400 });
  }

  const body = (await request.json()) as HardDeleteBoardBody;
  const confirmBoardTitle = body.confirmBoardTitle?.trim() ?? "";

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, title: true, isActive: true },
  });

  if (!board) {
    return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  if (board.isActive) {
    return NextResponse.json(
      { message: "활성 게시판은 바로 삭제할 수 없습니다. 먼저 비활성화해 주세요." },
      { status: 400 },
    );
  }

  if (confirmBoardTitle !== board.title) {
    return NextResponse.json(
      { message: "확인용 게시판 이름이 일치하지 않습니다." },
      { status: 400 },
    );
  }

  await prisma.board.delete({ where: { id } });
  return NextResponse.json({ message: "게시판이 최종 삭제되었습니다." });
}
