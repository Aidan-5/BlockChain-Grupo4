/*
  Warnings:

  - A unique constraint covering the columns `[wallet]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[did]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `did` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_wallet_key` ON `Usuario`(`wallet`);

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_did_key` ON `Usuario`(`did`);
