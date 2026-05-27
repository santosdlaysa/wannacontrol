-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('SANGRIA', 'SUPRIMENTO');

-- CreateTable
CREATE TABLE "caixas" (
    "id" SERIAL NOT NULL,
    "operador_id" INTEGER NOT NULL,
    "valor_inicial" DECIMAL(10,2) NOT NULL,
    "valor_final" DECIMAL(10,2),
    "total_vendas" DECIMAL(10,2),
    "abertura_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechamento_em" TIMESTAMP(3),
    "observacao" TEXT,
    "aberto" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "caixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_caixa" (
    "id" SERIAL NOT NULL,
    "caixa_id" INTEGER NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_caixa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "caixas" ADD CONSTRAINT "caixas_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_caixa" ADD CONSTRAINT "movimentacoes_caixa_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
