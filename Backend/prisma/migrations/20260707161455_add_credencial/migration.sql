-- CreateTable
CREATE TABLE `Credencial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `hashBlockchain` VARCHAR(191) NULL,
    `emitidaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NOT NULL,
    `institucionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Credencial` ADD CONSTRAINT `Credencial_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Credencial` ADD CONSTRAINT `Credencial_institucionId_fkey` FOREIGN KEY (`institucionId`) REFERENCES `Institucion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
