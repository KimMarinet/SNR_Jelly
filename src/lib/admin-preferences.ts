import { prisma } from "@/lib/prisma";

type HeroPreferenceRow = {
  heroBackgroundStoredName: string | null;
  heroBackgroundUrl: string | null;
};

let tableEnsured = false;

async function ensureAdminPreferenceTable() {
  if (tableEnsured) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS AdminPreference (
      id INTEGER NOT NULL AUTO_INCREMENT,
      userId INTEGER NOT NULL,
      heroBackgroundStoredName VARCHAR(191) NULL,
      heroBackgroundUrl VARCHAR(191) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY AdminPreference_userId_key (userId),
      PRIMARY KEY (id),
      CONSTRAINT AdminPreference_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  tableEnsured = true;
}

async function getPreferenceRow(userId: number): Promise<HeroPreferenceRow | null> {
  await ensureAdminPreferenceTable();

  const rows = await prisma.$queryRawUnsafe<HeroPreferenceRow[]>(
    "SELECT heroBackgroundStoredName, heroBackgroundUrl FROM AdminPreference WHERE userId = ? LIMIT 1",
    userId,
  );

  return rows[0] ?? null;
}

export async function getAdminHeroBackgroundUrl(userId: number): Promise<string | null> {
  const row = await getPreferenceRow(userId);
  return row?.heroBackgroundUrl ?? null;
}

export async function setAdminHeroBackground(
  userId: number,
  storedName: string,
  publicUrl: string,
): Promise<{ previousStoredName: string | null; backgroundImageUrl: string | null }> {
  const previous = await getPreferenceRow(userId);

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO AdminPreference (userId, heroBackgroundStoredName, heroBackgroundUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        heroBackgroundStoredName = VALUES(heroBackgroundStoredName),
        heroBackgroundUrl = VALUES(heroBackgroundUrl),
        updatedAt = CURRENT_TIMESTAMP(3)
    `,
    userId,
    storedName,
    publicUrl,
  );

  return {
    previousStoredName: previous?.heroBackgroundStoredName ?? null,
    backgroundImageUrl: publicUrl,
  };
}

export async function clearAdminHeroBackground(
  userId: number,
): Promise<{ previousStoredName: string | null; backgroundImageUrl: null }> {
  const previous = await getPreferenceRow(userId);

  if (previous) {
    await prisma.$executeRawUnsafe(
      `
        UPDATE AdminPreference
        SET heroBackgroundStoredName = NULL,
            heroBackgroundUrl = NULL,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE userId = ?
      `,
      userId,
    );
  }

  return {
    previousStoredName: previous?.heroBackgroundStoredName ?? null,
    backgroundImageUrl: null,
  };
}
