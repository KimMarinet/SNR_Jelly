import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";
import { attachSystemProtection, ensureSystemBoards } from "@/lib/system-boards";

type CreateBoardBody = {
  title?: string;
  slug?: string;
  description?: string | null;
  order?: number;
  isAdminWriteOnly?: boolean;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
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
    return { ok: false as const, message: "Board title is required." };
  }

  if (!slug || !isValidSlug(slug)) {
    return {
      ok: false as const,
      message: "Slug may contain only lowercase letters, numbers, and hyphens.",
    };
  }

  return {
    ok: true as const,
    data: {
      title,
      slug,
      description: body.description?.trim() || null,
      order: Number.isFinite(body.order) ? Number(body.order) : 0,
      isAdminWriteOnly: body.isAdminWriteOnly === true,
    },
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  await ensureSystemBoards();

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
      isAdminWriteOnly: true,
      _count: {
        select: { posts: true },
      },
    },
  });

  return NextResponse.json({ boards: await attachSystemProtection(boards) });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  await ensureSystemBoards();

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
        isAdminWriteOnly: true,
        _count: {
          select: { posts: true },
        },
      },
    });
    const [protectedBoard] = await attachSystemProtection([board]);

    revalidateTag("board-navigation", "max");
    revalidatePath("/lounge");
    revalidatePath(`/board/${board.slug}`);

    return NextResponse.json({ board: protectedBoard }, { status: 201 });
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

    return NextResponse.json({ message: "Failed to create board." }, { status: 500 });
  }
}
