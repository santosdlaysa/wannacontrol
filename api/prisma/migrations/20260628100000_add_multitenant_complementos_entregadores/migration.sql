-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Multi-Tenant + Complementos + Entregadores + Configuracoes
-- ─────────────────────────────────────────────────────────────────────────────

-- Plano enum
CREATE TYPE "Plano" AS ENUM ('BASICO', 'PROFISSIONAL', 'ENTERPRISE');

-- ─── Restaurantes ────────────────────────────────────────────────────────────
CREATE TABLE "restaurantes" (
  "id"        SERIAL PRIMARY KEY,
  "nome"      VARCHAR(150) NOT NULL,
  "slug"      VARCHAR(100) NOT NULL UNIQUE,
  "cnpj"      VARCHAR(18),
  "telefone"  VARCHAR(20),
  "email"     VARCHAR(100),
  "logo_url"  VARCHAR(500),
  "endereco"  VARCHAR(300),
  "plano"     "Plano" NOT NULL DEFAULT 'BASICO',
  "ativo"     BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Categorias ──────────────────────────────────────────────────────────────
CREATE TABLE "categorias" (
  "id"              SERIAL PRIMARY KEY,
  "restaurante_id"  INTEGER NOT NULL,
  "nome"            VARCHAR(100) NOT NULL,
  "descricao"       TEXT,
  "imagem_url"      VARCHAR(500),
  "ativo"           BOOLEAN NOT NULL DEFAULT true,
  "ordem"           INTEGER NOT NULL DEFAULT 0,
  "criado_em"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "categorias_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id")
);

-- ─── Grupos de Complemento ───────────────────────────────────────────────────
CREATE TABLE "grupos_complemento" (
  "id"              SERIAL PRIMARY KEY,
  "restaurante_id"  INTEGER NOT NULL,
  "nome"            VARCHAR(100) NOT NULL,
  "descricao"       TEXT,
  "obrigatorio"     BOOLEAN NOT NULL DEFAULT false,
  "minimo"          INTEGER NOT NULL DEFAULT 0,
  "maximo"          INTEGER NOT NULL DEFAULT 1,
  "ativo"           BOOLEAN NOT NULL DEFAULT true,
  "criado_em"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "grupos_complemento_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id")
);

-- ─── Itens de Complemento ────────────────────────────────────────────────────
CREATE TABLE "itens_complemento" (
  "id"         SERIAL PRIMARY KEY,
  "grupo_id"   INTEGER NOT NULL,
  "nome"       VARCHAR(100) NOT NULL,
  "preco"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "disponivel" BOOLEAN NOT NULL DEFAULT true,
  "criado_em"  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "itens_complemento_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_complemento"("id")
);

-- ─── Produto-Grupos (junction) ────────────────────────────────────────────────
CREATE TABLE "produto_grupos" (
  "produto_id" INTEGER NOT NULL,
  "grupo_id"   INTEGER NOT NULL,
  "ordem"      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("produto_id", "grupo_id"),
  CONSTRAINT "produto_grupos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id"),
  CONSTRAINT "produto_grupos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_complemento"("id")
);

-- ─── Itens Pedido Complemento ────────────────────────────────────────────────
CREATE TABLE "itens_pedido_complemento" (
  "id"                  SERIAL PRIMARY KEY,
  "item_pedido_id"      INTEGER NOT NULL,
  "item_complemento_id" INTEGER NOT NULL,
  "quantidade"          INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "itens_pedido_complemento_item_pedido_id_fkey" FOREIGN KEY ("item_pedido_id") REFERENCES "itens_pedido"("id"),
  CONSTRAINT "itens_pedido_complemento_item_complemento_id_fkey" FOREIGN KEY ("item_complemento_id") REFERENCES "itens_complemento"("id")
);

-- ─── Entregadores ────────────────────────────────────────────────────────────
CREATE TABLE "entregadores" (
  "id"              SERIAL PRIMARY KEY,
  "restaurante_id"  INTEGER NOT NULL,
  "nome"            VARCHAR(100) NOT NULL,
  "telefone"        VARCHAR(20),
  "veiculo"         VARCHAR(50),
  "placa"           VARCHAR(10),
  "ativo"           BOOLEAN NOT NULL DEFAULT true,
  "criado_em"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "entregadores_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id")
);

-- ─── Configuracoes ───────────────────────────────────────────────────────────
CREATE TABLE "configuracoes" (
  "id"              SERIAL PRIMARY KEY,
  "restaurante_id"  INTEGER NOT NULL,
  "chave"           VARCHAR(100) NOT NULL,
  "valor"           TEXT,
  CONSTRAINT "configuracoes_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id"),
  CONSTRAINT "configuracoes_restaurante_id_chave_unique" UNIQUE ("restaurante_id", "chave")
);

-- ─── Adicionar colunas multi-tenant nos modelos existentes ───────────────────

-- usuarios: restaurante_id (nullable para compatibilidade), tornar email unico por restaurante
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD CONSTRAINT "usuarios_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id");

-- Remover unique constraint global de email e pin (se existir), adicionar scoped
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_email_key";
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_pin_key";
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_restaurante_id_key" ON "usuarios"("email", "restaurante_id");
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_pin_restaurante_id_key" ON "usuarios"("pin", "restaurante_id") WHERE "pin" IS NOT NULL;

-- produtos: restaurante_id + categoria_id
ALTER TABLE "produtos"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "categoria_id" INTEGER,
  ADD CONSTRAINT "produtos_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id"),
  ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");

-- mesas: restaurante_id, tornar numero unico por restaurante
ALTER TABLE "mesas"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD CONSTRAINT "mesas_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id");

ALTER TABLE "mesas" DROP CONSTRAINT IF EXISTS "mesas_numero_key";
CREATE UNIQUE INDEX IF NOT EXISTS "mesas_restaurante_id_numero_key" ON "mesas"("restaurante_id", "numero");

-- clientes: restaurante_id
ALTER TABLE "clientes"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD CONSTRAINT "clientes_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id");

-- pedidos: restaurante_id + entregador_id
ALTER TABLE "pedidos"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "entregador_id" INTEGER,
  ADD CONSTRAINT "pedidos_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id"),
  ADD CONSTRAINT "pedidos_entregador_id_fkey" FOREIGN KEY ("entregador_id") REFERENCES "entregadores"("id");

-- caixas: restaurante_id
ALTER TABLE "caixas"
  ADD COLUMN IF NOT EXISTS "restaurante_id" INTEGER,
  ADD CONSTRAINT "caixas_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "restaurantes"("id");

-- ─── Indices de performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "pedidos_restaurante_id_idx" ON "pedidos"("restaurante_id");
CREATE INDEX IF NOT EXISTS "pedidos_status_pedido_idx" ON "pedidos"("status_pedido");
CREATE INDEX IF NOT EXISTS "pedidos_tipo_pedido_idx" ON "pedidos"("tipo_pedido");
CREATE INDEX IF NOT EXISTS "pedidos_data_criacao_idx" ON "pedidos"("data_criacao");
CREATE INDEX IF NOT EXISTS "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");
CREATE INDEX IF NOT EXISTS "itens_pedido_status_preparo_idx" ON "itens_pedido"("status_preparo");
CREATE INDEX IF NOT EXISTS "clientes_restaurante_id_idx" ON "clientes"("restaurante_id");
CREATE INDEX IF NOT EXISTS "produtos_restaurante_id_idx" ON "produtos"("restaurante_id");
CREATE INDEX IF NOT EXISTS "entregadores_restaurante_id_idx" ON "entregadores"("restaurante_id");
