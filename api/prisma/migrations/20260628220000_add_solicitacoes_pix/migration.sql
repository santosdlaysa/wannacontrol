-- CreateEnum
CREATE TYPE "StatusSolicitacaoPix" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "solicitacoes_pix" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "plano_id" VARCHAR(50) NOT NULL,
    "plano_nome" VARCHAR(100) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusSolicitacaoPix" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_pix_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "solicitacoes_pix" ADD CONSTRAINT "solicitacoes_pix_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
