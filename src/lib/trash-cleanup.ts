import { prisma } from "@/lib/prisma";
import { removeAssetFile } from "@/lib/asset-storage";

export type CleanupSummary = {
  deletedPostCount: number;
  deletedAssetCount: number;
};

export async function cleanupTrashedResources(days = 30): Promise<CleanupSummary> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const assetsToDelete = await prisma.asset.findMany({
    where: {
      deletedAt: {
        not: null,
        lte: cutoff,
      },
    },
    select: {
      id: true,
      storedName: true,
    },
  });

  for (const asset of assetsToDelete) {
    await removeAssetFile(asset.storedName);
  }

  const deletedAssetsResult = await prisma.asset.deleteMany({
    where: {
      id: { in: assetsToDelete.map((asset) => asset.id) },
    },
  });

  const deletedPostsResult = await prisma.post.deleteMany({
    where: {
      deletedAt: {
        not: null,
        lte: cutoff,
      },
    },
  });

  return {
    deletedPostCount: deletedPostsResult.count,
    deletedAssetCount: deletedAssetsResult.count,
  };
}
