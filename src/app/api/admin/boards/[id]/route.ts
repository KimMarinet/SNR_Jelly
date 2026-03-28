import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";
import {
  attachSystemProtection,
  ensureSystemBoards,
  isBoardSystemProtected,
} from "@/lib/system-boards";

type UpdateBoardBody = {
  action?: "deactivate" | "restore";
  title?: string;
  slug?: string;
  description?: string | null;
  order?: number;
  isAdminWriteOnly?: boolean;
};

type HardDeleteBoardBody = {
  confirmBoardTitle?: string;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
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
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  await ensureSystemBoards();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid board ID." }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!board) {
    return NextResponse.json({ message: "Board not found." }, { status: 404 });
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
        isAdminWriteOnly: true,
        _count: { select: { posts: true } },
      },
    });
    const [protectedBoard] = await attachSystemProtection([updatedBoard]);

    revalidateTag("board-navigation", "max");
    revalidatePath("/lounge");
    revalidatePath(`/board/${updatedBoard.slug}`);

    return NextResponse.json({
      board: protectedBoard,
      message: body.action === "restore" ? "Board restored." : "Board deactivated.",
    });
  }

  const data: {
    title?: string;
    slug?: string;
    description?: string | null;
    order?: number;
    isAdminWriteOnly?: boolean;
  } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ message: "Board title is required." }, { status: 400 });
    }
    data.title = title;
  }

  if (typeof body.slug === "string") {
    const slug = normalizeSlug(body.slug);
    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json({ message: "Invalid slug format." }, { status: 400 });
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

  if (body.isAdminWriteOnly !== undefined) {
    data.isAdminWriteOnly = Boolean(body.isAdminWriteOnly);
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
        isAdminWriteOnly: true,
        _count: { select: { posts: true } },
      },
    });
    const [protectedBoard] = await attachSystemProtection([updatedBoard]);

    revalidateTag("board-navigation", "max");
    revalidatePath("/lounge");
    revalidatePath(`/board/${board.slug}`);
    if (updatedBoard.slug !== board.slug) {
      revalidatePath(`/board/${updatedBoard.slug}`);
    }

    return NextResponse.json({ board: protectedBoard, message: "Board updated." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "A board with this slug already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Failed to update board." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  await ensureSystemBoards();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid board ID." }, { status: 400 });
  }

  const body = (await request.json()) as HardDeleteBoardBody;
  const confirmBoardTitle = body.confirmBoardTitle?.trim() ?? "";

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, isActive: true },
  });

  if (!board) {
    return NextResponse.json({ message: "Board not found." }, { status: 404 });
  }

  if (await isBoardSystemProtected(board.id)) {
    return NextResponse.json(
      { message: "System protected boards cannot be deleted." },
      { status: 403 },
    );
  }

  if (board.isActive) {
    return NextResponse.json(
      { message: "Active boards cannot be deleted directly. Deactivate first." },
      { status: 400 },
    );
  }

  if (confirmBoardTitle !== board.title) {
    return NextResponse.json(
      { message: "Board title confirmation does not match." },
      { status: 400 },
    );
  }

  await prisma.board.delete({ where: { id } });
  revalidateTag("board-navigation", "max");
  revalidatePath("/lounge");
  revalidatePath(`/board/${board.slug}`);
  return NextResponse.json({ message: "Board deleted permanently." });
}
