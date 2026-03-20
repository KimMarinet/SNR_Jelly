import { NextResponse } from "next/server";
import {
  clearAdminSession,
  isAdminPassword,
  setAdminSession,
} from "@/lib/admin-auth";

type LoginRequestBody = {
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequestBody;
  const password = body.password?.trim() ?? "";

  if (!isAdminPassword(password)) {
    return NextResponse.json({ message: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ message: "관리자 인증에 성공했습니다." });
  setAdminSession(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "관리자 로그아웃이 완료되었습니다." });
  clearAdminSession(response);
  return response;
}
