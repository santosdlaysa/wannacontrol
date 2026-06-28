/*
  Warnings:

  - A unique constraint covering the columns `[pin,restaurante_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "caixas" DROP CONSTRAINT "caixas_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "categorias" DROP CONSTRAINT "categorias_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "clientes" DROP CONSTRAINT "clientes_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "configuracoes" DROP CONSTRAINT "configuracoes_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "entregadores" DROP CONSTRAINT "entregadores_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "grupos_complemento" DROP CONSTRAINT "grupos_complemento_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_complemento" DROP CONSTRAINT "itens_complemento_grupo_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido_complemento" DROP CONSTRAINT "itens_pedido_complemento_item_complemento_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido_complemento" DROP CONSTRAINT "itens_pedido_complemento_item_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "mesas" DROP CONSTRAINT "mesas_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_entregador_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_mesa_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "produto_grupos" DROP CONSTRAINT "produto_grupos_grupo_id_fkey";

-- DropForeignKey
ALTER TABLE "produto_grupos" DROP CONSTRAINT "produto_grupos_produto_id_fkey";

-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_restaurante_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_restaurante_id_fkey";

-- DropIndex
DROP INDEX "clientes_restaurante_id_idx";

-- DropIndex
DROP INDEX "entregadores_restaurante_id_idx";

-- DropIndex
DROP INDEX "itens_pedido_pedido_id_idx";

-- DropIndex
DROP INDEX "itens_pedido_status_preparo_idx";

-- DropIndex
DROP INDEX "mesas_numero_key";

-- DropIndex
DROP INDEX "pedidos_data_criacao_idx";

-- DropIndex
DROP INDEX "pedidos_restaurante_id_idx";

-- DropIndex
DROP INDEX "pedidos_status_pedido_idx";

-- DropIndex
DROP INDEX "pedidos_tipo_pedido_idx";

-- DropIndex
DROP INDEX "produtos_restaurante_id_idx";

-- DropIndex
DROP INDEX "usuarios_email_key";

-- DropIndex
DROP INDEX "usuarios_pin_key";

-- AlterTable
ALTER TABLE "categorias" ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "entregadores" ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "grupos_complemento" ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "itens_complemento" ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "restaurantes" ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_pin_restaurante_id_key" ON "usuarios"("pin", "restaurante_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_complemento" ADD CONSTRAINT "grupos_complemento_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_complemento" ADD CONSTRAINT "itens_complemento_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_complemento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_grupos" ADD CONSTRAINT "produto_grupos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_grupos" ADD CONSTRAINT "produto_grupos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_complemento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_complemento" ADD CONSTRAINT "itens_pedido_complemento_item_pedido_id_fkey" FOREIGN KEY ("item_pedido_id") REFERENCES "itens_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_complemento" ADD CONSTRAINT "itens_pedido_complemento_item_complemento_id_fkey" FOREIGN KEY ("item_complemento_id") REFERENCES "itens_complemento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregadores" ADD CONSTRAINT "entregadores_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_entregador_id_fkey" FOREIGN KEY ("entregador_id") REFERENCES "entregadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixas" ADD CONSTRAINT "caixas_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "configuracoes_restaurante_id_chave_unique" RENAME TO "configuracoes_restaurante_id_chave_key";
