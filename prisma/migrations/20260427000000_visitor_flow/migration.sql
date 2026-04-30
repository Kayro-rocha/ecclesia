-- Visitor: temperatura, jornada e flag de resposta não lida
ALTER TABLE `Visitor`
  ADD COLUMN `temperature`    ENUM('COLD','WARM','HOT') NOT NULL DEFAULT 'WARM',
  ADD COLUMN `flowStage`      INT NOT NULL DEFAULT 0,
  ADD COLUMN `flowActive`     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `lastContactAt`  DATETIME(3) NULL,
  ADD COLUMN `hasUnreadReply` BOOLEAN NOT NULL DEFAULT false;

-- VisitorContact: direção da mensagem (SENT | RECEIVED)
ALTER TABLE `VisitorContact`
  ADD COLUMN `direction` VARCHAR(10) NOT NULL DEFAULT 'SENT';

-- VisitorAutomation: horário fixo de culto + resposta automática
ALTER TABLE `VisitorAutomation`
  ADD COLUMN `cultoWeekday` INT NULL,
  ADD COLUMN `cultoHour`    INT NULL,
  ADD COLUMN `autoReply`    TEXT NULL;
