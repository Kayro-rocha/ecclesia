ALTER TABLE `Event` ADD COLUMN `listMode` VARCHAR(191) NOT NULL DEFAULT 'none';
ALTER TABLE `EventAttendee` ADD COLUMN `contributionItem` VARCHAR(191) NULL;

CREATE TABLE `EventItem` (
  `id`        VARCHAR(191) NOT NULL,
  `eventId`   VARCHAR(191) NOT NULL,
  `label`     VARCHAR(191) NOT NULL,
  `claimedBy` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `EventItem_eventId_idx` (`eventId`),
  CONSTRAINT `EventItem_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `EventItem_claimedBy_fkey` FOREIGN KEY (`claimedBy`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
