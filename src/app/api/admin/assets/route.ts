import { AssetCategory } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ASSET_UPLOAD_CONSTRAINTS,
  normalizeOriginalFileName,
  removeAssetFile,
  validateAssetFile,
  writeAssetFile,
} from "@/lib/asset-storage";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function parseScope(scope: string | null): "active" | "trash" | "all" {
  if (scope === "active" || scope === "trash" || scope === "all") {
    return scope;
  }
  return "active";
}

function parseCategory(value: string | null): AssetCategory | undefined {
  if (!value) {
    return undefined;
  }
  if (value === "CHARACTER" || value === "SKILL" || value === "COMMON") {
    return value;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const category = parseCategory(request.nextUrl.searchParams.get("category"));
  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const assets = await prisma.asset.findMany({
    where: {
      ...(scope === "active"
        ? { deletedAt: null }
        : scope === "trash"
          ? { deletedAt: { not: null } }
          : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { originalName: { contains: search } },
              { storedName: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      originalName: true,
      storedName: true,
      mimeType: true,
      size: true,
      publicUrl: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    assets,
    constraints: ASSET_UPLOAD_CONSTRAINTS,
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");
  const categoryValue = formData.get("category");
  const category = parseCategory(String(categoryValue ?? "")) ?? "COMMON";

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ message: "File is required." }, { status: 400 });
  }

  const validationError = validateAssetFile(fileValue);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const originalName = normalizeOriginalFileName(fileValue.name || "asset");
  const uploaded = await writeAssetFile(fileValue);

  try {
    const asset = await prisma.asset.create({
      data: {
        category,
        originalName,
        storedName: uploaded.storedName,
        mimeType: fileValue.type,
        size: fileValue.size,
        filePath: uploaded.diskPath,
        publicUrl: uploaded.publicUrl,
      },
      select: {
        id: true,
        category: true,
        originalName: true,
        storedName: true,
        mimeType: true,
        size: true,
        publicUrl: true,
        deletedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    await removeAssetFile(uploaded.storedName);
    return NextResponse.json(
      { message: "Failed to save asset metadata.", detail: String(error) },
      { status: 500 },
    );
  }
}
