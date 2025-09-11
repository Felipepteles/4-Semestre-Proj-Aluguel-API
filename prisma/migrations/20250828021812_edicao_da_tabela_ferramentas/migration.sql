/*
  Warnings:

  - Added the required column `marca` to the `ferramentas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ferramentas" ADD COLUMN     "marca" VARCHAR(30) NOT NULL;
