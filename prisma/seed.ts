import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  const nickname = process.env.SEED_ADMIN_NICKNAME?.trim() || "handler-one";

  if (!email || !password) {
    console.warn(
      "Skipping admin seed. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      nickname,
      role: "ADMIN",
    },
    update: {
      passwordHash,
      nickname,
      role: "ADMIN",
    },
  });

  console.info(`Seeded admin user: ${email}`);
}

async function seedSystemBoards() {
  await Promise.all([
    prisma.board.upsert({
      where: { slug: "notice" },
      create: {
        slug: "notice",
        title: "공지 사항",
        description: "운영 공지와 업데이트 소식을 전달하는 게시판입니다.",
        order: 1,
        isActive: true,
        isSystemProtected: true,
      },
      update: {
        isSystemProtected: true,
      },
    }),
    prisma.board.upsert({
      where: { slug: "strategy" },
      create: {
        slug: "strategy",
        title: "전략글",
        description: "조합, 성장, 공략 노하우를 공유하는 게시판입니다.",
        order: 2,
        isActive: true,
        isSystemProtected: true,
      },
      update: {
        isSystemProtected: true,
      },
    }),
  ]);

  console.info("Seeded system boards: notice, strategy");
}

async function main() {
  await seedSystemBoards();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
