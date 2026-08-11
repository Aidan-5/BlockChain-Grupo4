-- AlterTable
ALTER TABLE `Credencial` ADD COLUMN `solicitudId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Credencial_solicitudId_key` ON `Credencial`(`solicitudId`);

-- AddForeignKey
ALTER TABLE `Credencial` ADD CONSTRAINT `Credencial_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `Solicitud`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
