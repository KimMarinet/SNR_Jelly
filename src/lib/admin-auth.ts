import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "snr_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "handler-one";
}

function createAdminSessionToken(password: string): string {
  return crypto
    .createHash("sha256")
    .update(`snr-admin:${password}`)
    .digest("hex");
}

function getExpectedAdminToken(): string {
  return createAdminSessionToken(getAdminPassword());
}

export function isAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}

export function isAdminToken(token: string | undefined): boolean {
  return !!token && token === getExpectedAdminToken();
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function hasAdminSessionFromRequest(request: NextRequest): boolean {
  return isAdminToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export function setAdminSession(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: getExpectedAdminToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function clearAdminSession(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
