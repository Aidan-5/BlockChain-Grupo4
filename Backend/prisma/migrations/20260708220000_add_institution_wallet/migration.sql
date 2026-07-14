-- AlterTable
ALTER TABLE `Institucion` ADD COLUMN `wallet` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Institucion_wallet_key` ON `Institucion`(`wallet`);
