-- CreateTable
CREATE TABLE "taxas_entrega_bairro" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "bairro" VARCHAR(100) NOT NULL,
    "taxa" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxas_entrega_bairro_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "taxas_entrega_bairro" ADD CONSTRAINT "taxas_entrega_bairro_restaurante_id_fkey"
  FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
