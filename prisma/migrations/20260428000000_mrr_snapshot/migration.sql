CREATE TABLE `MrrSnapshot` (
  `id` VARCHAR(191) NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `mrr` DOUBLE NOT NULL,
  `activeChurches` INT NOT NULL,
  `igrejaPlan` INT NOT NULL,
  `redePlan` INT NOT NULL,
  `newChurches` INT NOT NULL,
  `churnedChurches` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MrrSnapshot_month_year_key` (`month`, `year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
