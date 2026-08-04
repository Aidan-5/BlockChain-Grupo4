-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `identificacion` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL DEFAULT '123456',
    ADD COLUMN `rol` ENUM('CIUDADANO', 'ADMIN') NOT NULL DEFAULT 'CIUDADANO';

-- CreateTable
CREATE TABLE `Solicitud` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoCredencial` VARCHAR(191) NOT NULL,
    `datosJSON` TEXT NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `hashTemporal` VARCHAR(191) NULL,
    `usuarioId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Solicitud_hashTemporal_key`(`hashTemporal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_identificacion_key` ON `Usuario`(`identificacion`);

-- AddForeignKey
ALTER TABLE `Solicitud` ADD CONSTRAINT `Solicitud_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

