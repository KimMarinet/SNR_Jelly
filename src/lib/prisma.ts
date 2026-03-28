import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prismaV3: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prismaV3 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaV3 = prisma;
}
