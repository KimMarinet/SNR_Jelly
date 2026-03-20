-- AlterTable
ALTER TABLE `Post` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` ENUM('CHARACTER', 'SKILL', 'COMMON') NOT NULL DEFAULT 'COMMON',
    `originalName` VARCHAR(191) NOT NULL,
    `storedName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `publicUrl` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Asset_storedName_key`(`storedName`),
    INDEX `Asset_category_deletedAt_idx`(`category`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Post_isPublished_deletedAt_idx` ON `Post`(`isPublished`, `deletedAt`);
