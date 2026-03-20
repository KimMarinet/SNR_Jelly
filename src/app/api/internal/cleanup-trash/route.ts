import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionFromRequest } from "@/lib/admin-auth";
import { cleanupTrashedResources } from "@/lib/trash-cleanup";

function hasCleanupSecret(request: NextRequest): boolean {
  const secret = process.env.TRASH_CLEANUP_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("x-cleanup-secret") === secret;
}

export async function POST(request: NextRequest) {
  const authorized =
    hasAdminSessionFromRequest(request) || hasCleanupSecret(request);

  if (!authorized) {
    return NextResponse.json(
      { message: "정리 작업 권한이 없습니다." },
      { status: 401 },
    );
  }

  const summary = await cleanupTrashedResources(30);
  return NextResponse.json({
    message: "휴지통 정리가 완료되었습니다.",
    summary,
  });
}
