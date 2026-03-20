import { AssetCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import {
  ASSET_UPLOAD_CONSTRAINTS,
  removeAssetFile,
  sanitizeFileName,
  validateAssetFile,
  writeAssetFile,
} from "@/lib/asset-storage";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
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
  if (!hasAdminSessionFromRequest(request)) {
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
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");
  const categoryValue = formData.get("category");
  const category = parseCategory(String(categoryValue ?? "")) ?? "COMMON";

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ message: "업로드할 파일이 필요합니다." }, { status: 400 });
  }

  const validationError = validateAssetFile(fileValue);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const safeOriginalName = sanitizeFileName(fileValue.name || "asset");
  const uploaded = await writeAssetFile(fileValue);

  try {
    const asset = await prisma.asset.create({
      data: {
        category,
        originalName: safeOriginalName,
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
      { message: "파일 메타데이터 저장에 실패했습니다.", detail: String(error) },
      { status: 500 },
    );
  }
}
