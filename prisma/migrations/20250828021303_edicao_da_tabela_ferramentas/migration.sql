/*
  Warnings:

  - Added the required column `categoriaId` to the `ferramentas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ferramentas" ADD COLUMN     "categoriaId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
