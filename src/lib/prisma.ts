import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prismaV2: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prismaV2 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaV2 = prisma;
}
