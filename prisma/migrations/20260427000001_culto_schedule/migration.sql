-- Tabela de cultos fixos semanais
CREATE TABLE `CultoSchedule` (
  `id`        VARCHAR(191) NOT NULL,
  `churchId`  VARCHAR(191) NOT NULL,
  `weekday`   INT NOT NULL,
  `hour`      INT NOT NULL,
  `minute`    INT NOT NULL DEFAULT 0,
  `active`    BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CultoSchedule_churchId_idx` (`churchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `CultoSchedule`
  ADD CONSTRAINT `CultoSchedule_churchId_fkey`
  FOREIGN KEY (`churchId`) REFERENCES `Church` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
