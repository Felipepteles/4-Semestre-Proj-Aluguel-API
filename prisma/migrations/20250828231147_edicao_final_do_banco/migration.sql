/*
  Warnings:

  - The primary key for the `clientes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `telefone` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `disponivel` on the `ferramentas` table. All the data in the column will be lost.
  - You are about to drop the column `marca` on the `ferramentas` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `ferramentas` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `reservas` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reservas` table. All the data in the column will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cpf` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `ferramentas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marcaId` to the `ferramentas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `ferramentas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observacao` to the `ferramentas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor` to the `reservas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_clienteId_fkey";

-- AlterTable
ALTER TABLE "clientes" DROP CONSTRAINT "clientes_pkey",
DROP COLUMN "telefone",
ADD COLUMN     "cpf" VARCHAR(12) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "senha" SET DATA TYPE VARCHAR(60),
ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "clientes_id_seq";

-- AlterTable
ALTER TABLE "ferramentas" DROP COLUMN "disponivel",
DROP COLUMN "marca",
DROP COLUMN "modelo",
ADD COLUMN     "adminId" TEXT NOT NULL,
ADD COLUMN     "marcaId" INTEGER NOT NULL,
ADD COLUMN     "nome" VARCHAR(30) NOT NULL,
ADD COLUMN     "observacao" VARCHAR(100) NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "reservas" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "valor" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "clienteId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "admins";

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telefones" (
    "id" SERIAL NOT NULL,
    "tel1" INTEGER NOT NULL,
    "tel2" INTEGER,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "telefones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" SERIAL NOT NULL,
    "logradouro" VARCHAR(40) NOT NULL,
    "num" INTEGER NOT NULL,
    "bairro" VARCHAR(40) NOT NULL,
    "cidade" VARCHAR(40) NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" INTEGER NOT NULL,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telefones" ADD CONSTRAINT "telefones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
