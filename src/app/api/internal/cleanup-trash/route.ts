import { NextRequest, NextResponse } from "next/server";
import { cleanupTrashedResources } from "@/lib/trash-cleanup";
import { getAdminSession } from "@/lib/route-auth";

function hasCleanupSecret(request: NextRequest): boolean {
  const secret = process.env.TRASH_CLEANUP_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("x-cleanup-secret") === secret;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  const authorized = Boolean(admin) || hasCleanupSecret(request);

  if (!authorized) {
    return NextResponse.json({ message: "Cleanup authorization failed." }, { status: 401 });
  }

  const summary = await cleanupTrashedResources(30);
  return NextResponse.json({
    message: "Trash cleanup complete.",
    summary,
  });
}
