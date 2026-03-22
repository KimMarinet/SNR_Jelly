import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId(): Promise<number | null> {
  const session = await getServerAuthSession();
  const rawId = session?.user?.id;
  const userId = Number(rawId);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function getCurrentUserAuth() {
  const session = await getServerAuthSession();
  const rawId = session?.user?.id;
  const userId = Number(rawId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  return {
    id: userId,
    role: session?.user?.role ?? "USER",
    email: session?.user?.email ?? null,
  };
}

export async function isAdminSession(): Promise<boolean> {
  const session = await getServerAuthSession();
  return session?.user?.role === "ADMIN";
}
