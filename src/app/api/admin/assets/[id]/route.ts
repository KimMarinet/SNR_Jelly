import { NextRequest, NextResponse } from "next/server";
import { removeAssetFile } from "@/lib/asset-storage";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

type UpdateAssetBody = {
  action?: "trash" | "restore";
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
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
    return NextResponse.json({ message: "Invalid asset ID." }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!asset) {
    return NextResponse.json({ message: "Asset not found." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateAssetBody;
  if (body.action !== "trash" && body.action !== "restore") {
    return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
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
    message: body.action === "trash" ? "Asset moved to trash." : "Asset restored.",
  });
}

export async function DELETE(
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
    return NextResponse.json({ message: "Invalid asset ID." }, { status: 400 });
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
    return NextResponse.json({ message: "Asset not found." }, { status: 404 });
  }

  if (!asset.deletedAt) {
    return NextResponse.json(
      { message: "Only trashed assets can be permanently deleted." },
      { status: 400 },
    );
  }

  await prisma.asset.delete({ where: { id } });
  await removeAssetFile(asset.storedName);

  return NextResponse.json({ message: "Asset deleted permanently." });
}
