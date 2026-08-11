-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `institucionId` INTEGER NULL,
    MODIFY `rol` ENUM('CIUDADANO', 'ADMIN', 'INSTITUCION') NOT NULL DEFAULT 'CIUDADANO';

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_institucionId_key` ON `Usuario`(`institucionId`);

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_institucionId_fkey` FOREIGN KEY (`institucionId`) REFERENCES `Institucion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
