import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureSystemBoards } from "@/lib/system-boards";

export type BoardNavigationItem = {
  slug: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
};

const MOCK_BOARD_ITEMS: BoardNavigationItem[] = [
  {
    slug: "notice",
    title: "공지사항",
    description: "운영 공지와 업데이트 소식을 확인하세요.",
    order: 1,
    isActive: true,
  },
  {
    slug: "strategy",
    title: "실전 공략",
    description: "세팅, 덱 조합, 보스 공략 노하우를 공유합니다.",
    order: 2,
    isActive: true,
  },
  {
    slug: "showcase",
    title: "자랑 게시판",
    description: "획득 영웅, 클리어 인증, 스샷을 올려보세요.",
    order: 3,
    isActive: true,
  },
];

const getBoardItemsFromDb = unstable_cache(
  async (): Promise<BoardNavigationItem[]> => {
    await ensureSystemBoards();

    return prisma.board.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: {
        slug: true,
        title: true,
        description: true,
        order: true,
        isActive: true,
      },
    });
  },
  ["board-navigation"],
  { revalidate: 60, tags: ["board-navigation"] },
);

export async function getBoardNavigation(): Promise<{
  items: BoardNavigationItem[];
  source: "db" | "mock";
}> {
  try {
    const dbItems = await getBoardItemsFromDb();

    if (dbItems.length > 0) {
      return { items: dbItems, source: "db" };
    }

    return { items: MOCK_BOARD_ITEMS, source: "mock" };
  } catch (error) {
    console.error("Failed to load board navigation. Falling back to mock.", error);
    return { items: MOCK_BOARD_ITEMS, source: "mock" };
  }
}

export async function getBoardBySlug(
  slug: string,
): Promise<BoardNavigationItem | null> {
  const { items } = await getBoardNavigation();
  return items.find((item) => item.slug === slug) ?? null;
}
