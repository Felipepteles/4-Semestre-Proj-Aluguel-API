/*
  Warnings:

  - The `nivel` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('COMUM', 'MODERADOR', 'ADMIN');

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "nivel",
ADD COLUMN     "nivel" "Nivel";
