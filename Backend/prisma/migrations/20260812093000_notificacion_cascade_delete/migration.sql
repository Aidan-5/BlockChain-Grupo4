-- DropForeignKey
ALTER TABLE `Notificacion` DROP FOREIGN KEY `Notificacion_destinatarioUsuarioId_fkey`;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_destinatarioUsuarioId_fkey` FOREIGN KEY (`destinatarioUsuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
