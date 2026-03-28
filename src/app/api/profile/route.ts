import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

const profileUpdateSchema = z.object({
  nickname: z.string().trim().min(2).max(24),
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72).optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "입력값을 다시 확인해 주세요." }, { status: 400 });
  }

  const nickname = parsed.data.nickname.trim();
  const currentPassword = parsed.data.currentPassword;
  const newPassword = parsed.data.newPassword ?? "";
  const confirmPassword = parsed.data.confirmPassword ?? "";

  if (!nickname) {
    return NextResponse.json({ message: "닉네임은 비워둘 수 없습니다." }, { status: 400 });
  }

  if (newPassword || confirmPassword) {
    if (!newPassword) {
      return NextResponse.json(
        { message: "비밀번호를 변경하려면 새 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." },
        { status: 400 },
      );
    }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      nickname: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!currentUser) {
    return NextResponse.json({ message: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const hasNicknameChange = nickname !== currentUser.nickname;
  const hasPasswordChange = Boolean(newPassword);

  if (!hasNicknameChange && !hasPasswordChange) {
    return NextResponse.json({ message: "변경된 내용이 없습니다." }, { status: 400 });
  }

  if (!currentUser.passwordHash) {
    return NextResponse.json(
      { message: "현재 비밀번호를 확인할 수 없는 계정입니다." },
      { status: 400 },
    );
  }

  const currentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
  if (!currentPasswordValid) {
    return NextResponse.json({ message: "현재 비밀번호가 일치하지 않습니다." }, { status: 400 });
  }

  const nextPasswordHash = hasPasswordChange ? await bcrypt.hash(newPassword, 10) : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      nickname,
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
    },
    select: {
      email: true,
      nickname: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      message: hasPasswordChange
        ? "프로필 정보와 비밀번호가 저장되었습니다."
        : "프로필 정보가 저장되었습니다.",
      user: updatedUser,
    },
    { status: 200 },
  );
}
