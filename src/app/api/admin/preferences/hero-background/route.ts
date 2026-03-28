import { NextRequest, NextResponse } from "next/server";
import {
  removeAdminHeroFile,
  validateAdminHeroFile,
  writeAdminHeroFile,
} from "@/lib/admin-hero-storage";
import { clearAdminHeroBackground, setAdminHeroBackground } from "@/lib/admin-preferences";
import { getAdminSession } from "@/lib/route-auth";

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

function invalidUserResponse() {
  return NextResponse.json({ message: "유효한 관리자 계정을 확인할 수 없습니다." }, { status: 400 });
}

function parseAdminUserId(input: string | undefined): number | null {
  const userId = Number(input);
  if (!Number.isInteger(userId) || userId < 1) {
    return null;
  }
  return userId;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const userId = parseAdminUserId(admin.user.id);
  if (!userId) {
    return invalidUserResponse();
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ message: "배경 이미지 파일이 필요합니다." }, { status: 400 });
  }

  const validationError = validateAdminHeroFile(fileValue);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const uploaded = await writeAdminHeroFile(fileValue);

  try {
    const preference = await setAdminHeroBackground(userId, uploaded.storedName, uploaded.publicUrl);

    if (
      preference.previousStoredName &&
      preference.previousStoredName !== uploaded.storedName
    ) {
      await removeAdminHeroFile(preference.previousStoredName).catch(() => undefined);
    }

    return NextResponse.json({
      backgroundImageUrl: preference.backgroundImageUrl,
      message: "개인 브리핑 배경 이미지를 저장했습니다.",
    });
  } catch (error) {
    await removeAdminHeroFile(uploaded.storedName).catch(() => undefined);
    return NextResponse.json(
      { message: "개인 배경 이미지를 저장하지 못했습니다.", detail: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const userId = parseAdminUserId(admin.user.id);
  if (!userId) {
    return invalidUserResponse();
  }

  const preference = await clearAdminHeroBackground(userId);
  if (!preference.previousStoredName) {
    return NextResponse.json({
      backgroundImageUrl: null,
      message: "저장된 개인 배경 이미지가 없습니다.",
    });
  }
  await removeAdminHeroFile(preference.previousStoredName).catch(() => undefined);

  return NextResponse.json({
    backgroundImageUrl: null,
    message: "개인 브리핑 배경 이미지를 제거했습니다.",
  });
}
