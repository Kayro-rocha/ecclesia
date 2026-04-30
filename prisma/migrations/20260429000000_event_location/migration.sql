ALTER TABLE `Event`
  ADD COLUMN `locationCep`       VARCHAR(191) NULL,
  ADD COLUMN `useChurchLocation` TINYINT(1)   NOT NULL DEFAULT 1,
  ADD COLUMN `lat`               DOUBLE       NULL,
  ADD COLUMN `lng`               DOUBLE       NULL;
