-- AlterTable
ALTER TABLE `Church` ADD COLUMN `parentChurchId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Church` ADD CONSTRAINT `Church_parentChurchId_fkey` FOREIGN KEY (`parentChurchId`) REFERENCES `Church`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
