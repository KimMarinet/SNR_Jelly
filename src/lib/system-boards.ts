import { prisma } from "@/lib/prisma";

export const SYSTEM_BOARD_PRESETS = [
  {
    slug: "notice",
    title: "공지 사항",
    description: "운영 공지와 업데이트 소식을 전달하는 게시판입니다.",
    order: 1,
  },
  {
    slug: "strategy",
    title: "전략글",
    description: "조합, 성장, 공략 노하우를 공유하는 게시판입니다.",
    order: 2,
  },
] as const;

export const SYSTEM_BOARD_SLUGS = SYSTEM_BOARD_PRESETS.map((board) => board.slug);

export function isSystemBoardSlug(slug: string): boolean {
  return SYSTEM_BOARD_SLUGS.includes(slug as (typeof SYSTEM_BOARD_SLUGS)[number]);
}

type BoardProtectionRow = {
  id: number;
  slug: string;
  isSystemProtected: boolean | number;
};

function toProtectionFlag(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function buildInClause(values: readonly (string | number)[]) {
  return values.map(() => "?").join(", ");
}

async function queryBoardProtectionRowsBySlugs(slugs: readonly string[]) {
  if (slugs.length === 0) {
    return [] as BoardProtectionRow[];
  }

  return prisma.$queryRawUnsafe<BoardProtectionRow[]>(
    `SELECT id, slug, isSystemProtected FROM Board WHERE slug IN (${buildInClause(slugs)})`,
    ...slugs,
  );
}

async function queryBoardProtectionRowsByIds(ids: readonly number[]) {
  if (ids.length === 0) {
    return [] as BoardProtectionRow[];
  }

  return prisma.$queryRawUnsafe<BoardProtectionRow[]>(
    `SELECT id, slug, isSystemProtected FROM Board WHERE id IN (${buildInClause(ids)})`,
    ...ids,
  );
}

export async function attachSystemProtection<T extends { id: number; slug: string }>(
  boards: readonly T[],
): Promise<Array<T & { isSystemProtected: boolean }>> {
  if (boards.length === 0) {
    return [];
  }

  const protectionRows = await queryBoardProtectionRowsByIds(boards.map((board) => board.id));
  const protectionMap = new Map(
    protectionRows.map((row) => [row.id, toProtectionFlag(row.isSystemProtected)]),
  );

  return boards.map((board) => ({
    ...board,
    isSystemProtected: protectionMap.get(board.id) ?? false,
  }));
}

export async function isBoardSystemProtected(boardId: number): Promise<boolean> {
  const [row] = await queryBoardProtectionRowsByIds([boardId]);
  return toProtectionFlag(row?.isSystemProtected);
}

export async function ensureSystemBoards() {
  const existingBoards = await prisma.board.findMany({
    where: { slug: { in: [...SYSTEM_BOARD_SLUGS] } },
    select: {
      id: true,
      slug: true,
    },
  });
  const protectionRows = await queryBoardProtectionRowsBySlugs(SYSTEM_BOARD_SLUGS);
  const protectionMap = new Map(
    protectionRows.map((row) => [row.slug, toProtectionFlag(row.isSystemProtected)]),
  );

  const existingBoardMap = new Map(existingBoards.map((board) => [board.slug, board]));

  for (const preset of SYSTEM_BOARD_PRESETS) {
    const existingBoard = existingBoardMap.get(preset.slug);

    if (!existingBoard) {
      await prisma.board.create({
        data: {
          slug: preset.slug,
          title: preset.title,
          description: preset.description,
          order: preset.order,
          isActive: true,
        },
      });
      await prisma.$executeRawUnsafe(
        "UPDATE Board SET isSystemProtected = true WHERE slug = ?",
        preset.slug,
      );
      continue;
    }

    if (!protectionMap.get(preset.slug)) {
      await prisma.$executeRawUnsafe(
        "UPDATE Board SET isSystemProtected = true WHERE id = ?",
        existingBoard.id,
      );
    }
  }
}
