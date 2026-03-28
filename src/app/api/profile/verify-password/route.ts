import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

const verifyPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = verifyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "?꾩옱 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { message: "?꾩옱 鍮꾨?踰덊샇瑜??뺤씤?????녿뒗 怨꾩젙?낅땲??" },
      { status: 400 },
    );
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "?꾩옱 鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎." }, { status: 400 });
  }

  return NextResponse.json({ message: "?꾩옱 鍮꾨?踰덊샇 ?뺤씤???꾨즺?섏뿀?듬땲??" }, { status: 200 });
}
