import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

type CreateLandingVideoBody = {
  title?: string | null;
  youtubeId?: string;
  order?: number;
  isActive?: boolean;
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
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

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const videos = await prisma.landingVideo.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
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

  return NextResponse.json({ videos });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateLandingVideoBody;
  const normalizedId = parseYouTubeId(body.youtubeId ?? "");
  if (!normalizedId) {
    return NextResponse.json(
      { message: "Valid YouTube video ID or URL is required." },
      { status: 400 },
    );
  }

  try {
    const video = await prisma.landingVideo.create({
      data: {
        title: body.title?.trim() || null,
        youtubeId: normalizedId,
        order: Number.isFinite(body.order) ? Number(body.order) : 0,
        isActive: body.isActive ?? true,
      },
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
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This YouTube video is already registered." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Failed to create landing video." }, { status: 500 });
  }
}
