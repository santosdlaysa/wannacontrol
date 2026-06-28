-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('MESA', 'DELIVERY', 'RETIRADA');

-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('RECEBIDO', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO', 'SAIU_ENTREGA', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "endereco" VARCHAR(255),
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100),
    "cidade" VARCHAR(100),
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- AlterTable pedidos: tornar mesa_id opcional e adicionar campos de delivery
ALTER TABLE "pedidos"
    ADD COLUMN "cliente_id" INTEGER,
    ADD COLUMN "tipo_pedido" "TipoPedido" NOT NULL DEFAULT 'MESA',
    ADD COLUMN "status_entrega" "StatusEntrega",
    ADD COLUMN "forma_pagamento" "FormaPagamento",
    ADD COLUMN "endereco_entrega" VARCHAR(300),
    ADD COLUMN "taxa_entrega" DECIMAL(10,2),
    ADD COLUMN "observacao" TEXT,
    ALTER COLUMN "mesa_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
