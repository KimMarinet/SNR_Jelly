import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(72),
  nickname: z.string().min(2).max(24),
});

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration input." },
      { status: 400 },
    );
  }

  const { email, password, nickname } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email already in use." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Failed to register user." }, { status: 500 });
  }
}
