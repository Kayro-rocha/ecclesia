-- Migrate existing data before altering enum
UPDATE `Church` SET `plan` = 'IGREJA' WHERE `plan` = 'BASIC';
UPDATE `Church` SET `plan` = 'REDE' WHERE `plan` = 'PRO';
UPDATE `OnboardingToken` SET `plan` = 'IGREJA' WHERE `plan` = 'BASIC';
UPDATE `OnboardingToken` SET `plan` = 'REDE' WHERE `plan` = 'PRO';

-- AlterTable Church
ALTER TABLE `Church` MODIFY COLUMN `plan` ENUM('IGREJA', 'REDE') NOT NULL DEFAULT 'IGREJA';

-- AlterTable OnboardingToken
ALTER TABLE `OnboardingToken` MODIFY COLUMN `plan` ENUM('IGREJA', 'REDE') NOT NULL DEFAULT 'IGREJA';
