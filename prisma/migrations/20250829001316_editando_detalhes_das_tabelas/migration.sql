/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Endereco` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Marca` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Endereco" DROP CONSTRAINT "Endereco_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ferramentas" DROP CONSTRAINT "ferramentas_adminId_fkey";

-- DropForeignKey
ALTER TABLE "ferramentas" DROP CONSTRAINT "ferramentas_marcaId_fkey";

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Endereco";

-- DropTable
DROP TABLE "Marca";

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" SERIAL NOT NULL,
    "logradouro" VARCHAR(40) NOT NULL,
    "num" INTEGER NOT NULL,
    "bairro" VARCHAR(40) NOT NULL,
    "cidade" VARCHAR(40) NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" INTEGER NOT NULL,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
