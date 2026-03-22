import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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

async function main() {
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
