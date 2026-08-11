-- Normalize existing free-text tipoCredencial values before converting the column to an ENUM.
-- Pre-existing rows all used the human-readable label 'Cédula de Identidad', which maps to CEDULA.
UPDATE `Solicitud` SET `tipoCredencial` = 'CEDULA' WHERE `tipoCredencial` NOT IN ('CEDULA', 'DISCAPACIDAD');

-- AlterTable
ALTER TABLE `Institucion` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Solicitud` ADD COLUMN `institucionId` INTEGER NULL,
    MODIFY `tipoCredencial` ENUM('CEDULA', 'DISCAPACIDAD') NOT NULL;

-- Backfill institucionId on pre-existing Solicitud rows (created before institution selection
-- existed on the request form). Institucion id=1 (Registro Civil del Ecuador) is used because,
-- historically, approve() always issued credentials under that institution, so it matches the
-- de-facto semantics of these rows before this change.
UPDATE `Solicitud` SET `institucionId` = 1 WHERE `institucionId` IS NULL;

-- AlterTable
ALTER TABLE `Solicitud` MODIFY `institucionId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE `Solicitud` ADD CONSTRAINT `Solicitud_institucionId_fkey` FOREIGN KEY (`institucionId`) REFERENCES `Institucion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
