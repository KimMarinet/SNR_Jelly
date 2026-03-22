import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

type UpdateLandingVideoBody = {
  title?: string | null;
  youtubeId?: string;
  order?: number;
  isActive?: boolean;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const idPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (idPattern.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host.includes("youtu.be")) {
      const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return idPattern.test(candidate) ? candidate : null;
    }

    if (host.includes("youtube.com")) {
      const byQuery = url.searchParams.get("v");
      if (byQuery && idPattern.test(byQuery)) {
        return byQuery;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1] ?? "";
      if (
        (segments[0] === "embed" || segments[0] === "shorts") &&
        idPattern.test(lastSegment)
      ) {
        return lastSegment;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid landing video ID." }, { status: 400 });
  }

  const body = (await request.json()) as UpdateLandingVideoBody;
  const data: {
    title?: string | null;
    youtubeId?: string;
    order?: number;
    isActive?: boolean;
  } = {};

  if (body.title !== undefined) {
    data.title = typeof body.title === "string" ? body.title.trim() || null : null;
  }

  if (body.youtubeId !== undefined) {
    const normalizedId = parseYouTubeId(body.youtubeId);
    if (!normalizedId) {
      return NextResponse.json(
        { message: "Valid YouTube video ID or URL is required." },
        { status: 400 },
      );
    }
    data.youtubeId = normalizedId;
  }

  if (body.order !== undefined) {
    data.order = Number.isFinite(body.order) ? Number(body.order) : 0;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  try {
    const video = await prisma.landingVideo.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        youtubeId: true,
        order: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/");
    return NextResponse.json({ video, message: "Landing video updated." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Landing video not found." }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This YouTube video is already registered." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Failed to update landing video." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid landing video ID." }, { status: 400 });
  }

  try {
    await prisma.landingVideo.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ message: "Landing video removed." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Landing video not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to remove landing video." }, { status: 500 });
  }
}
