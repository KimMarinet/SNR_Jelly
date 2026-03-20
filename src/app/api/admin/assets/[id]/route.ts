import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { removeAssetFile } from "@/lib/asset-storage";
import { prisma } from "@/lib/prisma";

type UpdateAssetBody = {
  action?: "trash" | "restore";
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
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
    return NextResponse.json({ message: "유효하지 않은 파일 ID입니다." }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!asset) {
    return NextResponse.json({ message: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateAssetBody;
  if (body.action !== "trash" && body.action !== "restore") {
    return NextResponse.json({ message: "지원하지 않는 작업입니다." }, { status: 400 });
  }

  const updatedAsset = await prisma.asset.update({
    where: { id },
    data: {
      deletedAt: body.action === "trash" ? new Date() : null,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  return NextResponse.json({
    asset: updatedAsset,
    message: body.action === "trash" ? "파일을 휴지통으로 이동했습니다." : "파일을 복구했습니다.",
  });
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
    return NextResponse.json({ message: "유효하지 않은 파일 ID입니다." }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: {
      id: true,
      storedName: true,
      deletedAt: true,
    },
  });

  if (!asset) {
    return NextResponse.json({ message: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!asset.deletedAt) {
    return NextResponse.json(
      { message: "휴지통에 있는 파일만 영구 삭제할 수 있습니다." },
      { status: 400 },
    );
  }

  await prisma.asset.delete({ where: { id } });
  await removeAssetFile(asset.storedName);

  return NextResponse.json({ message: "파일이 영구 삭제되었습니다." });
}
