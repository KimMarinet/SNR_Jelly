-- AlterTable
ALTER TABLE `Post` ADD COLUMN `isPinned` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Post_isPinned_isPublished_deletedAt_idx` ON `Post`(`isPinned`, `isPublished`, `deletedAt`);
