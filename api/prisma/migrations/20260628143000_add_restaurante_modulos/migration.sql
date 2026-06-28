CREATE TABLE IF NOT EXISTS "restaurante_modulos" (
  "id" SERIAL PRIMARY KEY,
  "restaurante_id" INTEGER NOT NULL REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "modulo" VARCHAR(50) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurante_modulos_restaurante_id_modulo_key"
  ON "restaurante_modulos"("restaurante_id", "modulo");
