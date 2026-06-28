# PRD — ChefFlow Delivery (ChefFlow)
## Sistema SaaS para Gestão de Delivery de Restaurantes

---

## 1. Visão Geral

Sistema multiusuário para gestão de restaurantes com suporte a mesas, delivery e retirada. Operado via **web** (balcão/gestão) e **mobile** (garçons/cozinha).

---

## 2. Perfis de Usuário

| Perfil    | Acesso Principal |
|-----------|-----------------|
| ADMIN     | Tudo |
| GERENTE   | Tudo exceto configurações críticas |
| CAIXA     | Pedidos, caixa, financeiro |
| GARCOM    | Mesas, pedidos, delivery |
| COZINHA   | Apenas tela de cozinha (KDS) |

---

## 3. Funcionalidades (PRD)

### 3.1 Autenticação
- Login com email + senha
- Login por PIN (garçons/cozinha)
- JWT access token + refresh token
- Controle de acesso por perfil (RBAC)

### 3.2 Dashboard
- Pedidos do dia (total, pagos, abertos)
- Itens em preparo e prontos
- Faturamento do dia e do mês
- Acesso rápido às principais seções

### 3.3 Mesas
- Grid visual com status (LIVRE/OCUPADA/RESERVADA)
- Abrir pedido vinculado à mesa
- Adicionar itens ao pedido
- Fechar conta (selecionar forma de pagamento)
- Liberar mesa automaticamente ao fechar/cancelar

### 3.4 Pedidos (Mesa, Delivery, Retirada)
- `tipoPedido`: MESA / DELIVERY / RETIRADA
- `statusPedido`: ABERTO → PAGO / CANCELADO
- `statusEntrega`: RECEBIDO → CONFIRMADO → EM_PREPARO → PRONTO → SAIU_ENTREGA → ENTREGUE
- `formaPagamento`: DINHEIRO / CARTAO_CREDITO / CARTAO_DEBITO / PIX
- Campos de cliente para delivery: nome, telefone, endereço, taxa de entrega
- Observações por pedido

### 3.5 Cozinha (KDS)
- Exibição de itens pendentes por pedido
- Avanço de status por item: PENDENTE → PREPARANDO → PRONTO
- Alertas visuais e sonoros
- Tempo decorrido por pedido
- Atualização em tempo real (WebSocket)

### 3.6 Clientes
- Cadastro: nome, telefone, endereço completo, observações
- Busca por nome ou telefone
- Histórico de pedidos por cliente
- Uso no fluxo de delivery (clienteId ou campos avulsos)

### 3.7 Produtos
- CRUD completo
- Campos: nome, descrição, preço, categoria, disponível, imagem (upload)
- Toggle rápido de disponibilidade
- Filtro por categoria + busca por nome

### 3.8 Caixa
- Abrir/fechar caixa com valor inicial
- Movimentações: sangria e suprimento
- Saldo calculado em tempo real
- Histórico de movimentações

### 3.9 Financeiro / Relatórios
- Resumo diário (faturamento, pedidos, top produtos, vendas por garçom)
- Faturamento mensal acumulado
- Histórico por data

### 3.10 Usuários
- CRUD de usuários
- Definição de perfil
- PIN opcional para login rápido
- Ativar/desativar usuário

### 3.11 Tempo Real (WebSocket)
- Mesa muda de status ao abrir/fechar pedido
- Cozinha recebe novos itens em tempo real
- Dashboard atualiza contadores
- Eventos: `mesa:statusChanged`, `order:newItems`, `order:closed`, `item:statusChanged`

---

## 4. Stack Técnica

| Camada     | Tecnologia |
|------------|-----------|
| API        | Node.js + Express + TypeScript + Prisma + PostgreSQL |
| Tempo Real | Socket.IO |
| Auth       | JWT (access + refresh) + PIN |
| Mobile     | React Native + Expo SDK 53 + Expo Router |
| Web        | Next.js 14 + App Router + Tailwind CSS |
| Shared     | Pacote `@chefflow/shared` (enums, types, validators) |

---

## 5. O Que Foi Implementado

### Backend (`api/`)

#### Banco de Dados (Prisma)
- [x] Model `Cliente` com campos: nome, telefone, endereco, complemento, bairro, cidade, observacao
- [x] Model `Pedido` atualizado: mesaId opcional, clienteId, tipoPedido, statusEntrega, formaPagamento, enderecoEntrega, taxaEntrega, observacao, clienteNome, clienteTelefone
- [x] Enums adicionados: `TipoPedido` (MESA/DELIVERY/RETIRADA), `StatusEntrega` (RECEBIDO→ENTREGUE+CANCELADO), `FormaPagamento` (DINHEIRO/CARTAO_CREDITO/CARTAO_DEBITO/PIX)
- [x] Migration SQL manual: `20260628000000_add_cliente_delivery`

#### Módulo Clientes (novo)
- [x] `GET /clientes?busca=` — listar com busca por nome/telefone
- [x] `GET /clientes/:id` — buscar com histórico de pedidos
- [x] `POST /clientes` — criar
- [x] `PUT /clientes/:id` — atualizar
- [x] `DELETE /clientes/:id` — remover

#### Módulo Pedidos (atualizado)
- [x] `POST /pedidos` — suporta MESA, DELIVERY e RETIRADA
- [x] `PATCH /pedidos/:id/fechar` — aceita `formaPagamento`, calcula total com taxa de entrega
- [x] `PATCH /pedidos/:id/cancelar` — libera mesa apenas se houver mesa vinculada
- [x] `PATCH /pedidos/:id/status-entrega` — avança statusEntrega
- [x] `GET /pedidos` — lista com filtros por status e mesa_id

#### Módulo Financeiro (atualizado)
- [x] `GET /financeiro/dashboard` — pedidosHoje, pedidosPagosHoje, pedidosAbertos, emPreparo, prontos, faturamento, totalMes

### Shared Package (`packages/shared/`)
- [x] Enums: `TipoPedido`, `StatusEntrega`, `FormaPagamento`
- [x] Interface `Cliente`
- [x] Interface `Pedido` com todos os novos campos opcionais
- [x] `createPedidoSchema` atualizado (mesaId opcional, delivery fields)
- [x] `createClienteSchema` adicionado

### Mobile (`mobile/`)

#### Novas Tabs
- [x] **Dashboard** (`(tabs)/dashboard.tsx`) — cards de operações + faturamento, polling 30s
- [x] **Cozinha** (`(tabs)/cozinha.tsx`) — KDS com avanço de status por item, socket em tempo real
- [x] **Clientes** (`(tabs)/clientes.tsx`) — CRUD com modal, histórico de pedidos

#### Novas Telas (Stack)
- [x] **Relatórios** (`relatorios.tsx`) — resumo diário com navegação por data, top produtos, vendas por garçom
- [x] **Caixa** (`caixa-screen.tsx`) — abrir/fechar caixa, sangria/suprimento, saldo em tempo real
- [x] **Produtos** (`produtos.tsx`) — grid com filtro por categoria, toggle disponível, CRUD modal
- [x] **Pedidos Delivery** (`pedidos-delivery.tsx`) — fluxo completo de statusEntrega, detalhe do pedido, fechar/cancelar

#### Layout Atualizado
- [x] Tabs condicionais por perfil (COZINHA vê só Cozinha + Perfil)
- [x] Rotas protegidas para novas telas no `_layout.tsx`

### Web (`web/`)

#### Novas Páginas
- [x] **Dashboard** (`(dashboard)/page.tsx`) — stats cards, faturamento, acesso rápido, auto-refresh 30s
- [x] **Clientes** (`(dashboard)/clientes/page.tsx`) — tabela com busca, CRUD modal com endereço completo, histórico de pedidos
- [x] **Delivery** (`(dashboard)/delivery/page.tsx`) — lista de pedidos DELIVERY/RETIRADA, filtros por status e tipo, avanço de statusEntrega, modal de pagamento, cancelamento, detalhe completo

#### Sidebar Atualizado (`(dashboard)/layout.tsx`)
- [x] Dashboard adicionado (visível para ADMIN/GERENTE/CAIXA/GARCOM)
- [x] Delivery adicionado (visível para ADMIN/GERENTE/CAIXA/GARCOM)
- [x] Clientes adicionado (visível para ADMIN/GERENTE/CAIXA/GARCOM)
- [x] Active link usa `startsWith` para subpaths, match exato para `/`

---

## 6. Páginas Web — Estado Final

| Rota           | Status | Perfis com Acesso |
|----------------|--------|-------------------|
| `/`            | ✅ Novo | ADMIN, GERENTE, CAIXA, GARCOM |
| `/pedidos`     | ✅ Existia | ADMIN, GERENTE, CAIXA, GARCOM |
| `/mesas`       | ✅ Existia | ADMIN, GERENTE, CAIXA, GARCOM |
| `/delivery`    | ✅ Novo | ADMIN, GERENTE, CAIXA, GARCOM |
| `/cozinha`     | ✅ Existia | ADMIN, GERENTE, COZINHA |
| `/produtos`    | ✅ Existia | ADMIN, GERENTE |
| `/caixa`       | ✅ Existia | ADMIN, GERENTE, CAIXA |
| `/financeiro`  | ✅ Existia | ADMIN, GERENTE, CAIXA |
| `/clientes`    | ✅ Novo | ADMIN, GERENTE, CAIXA, GARCOM |
| `/usuarios`    | ✅ Existia | ADMIN, GERENTE |

---

## 7. Telas Mobile — Estado Final

| Tela              | Tipo  | Status | Perfis |
|-------------------|-------|--------|--------|
| Dashboard         | Tab   | ✅ Novo | Todos exceto COZINHA |
| Mesas             | Tab   | ✅ Existia | Todos exceto COZINHA |
| Cozinha           | Tab   | ✅ Novo | COZINHA, ADMIN, GERENTE |
| Clientes          | Tab   | ✅ Novo | Todos exceto COZINHA |
| Perfil            | Tab   | ✅ Existia | Todos |
| Novo Pedido       | Stack | ✅ Existia | GARCOM, ADMIN, GERENTE, CAIXA |
| Pedido (detalhe)  | Stack | ✅ Existia | Todos |
| Pedidos Delivery  | Stack | ✅ Novo | ADMIN, GERENTE, CAIXA, GARCOM |
| Relatórios        | Stack | ✅ Novo | ADMIN, GERENTE, CAIXA |
| Caixa             | Stack | ✅ Novo | ADMIN, GERENTE, CAIXA |
| Produtos          | Stack | ✅ Novo | ADMIN, GERENTE |

---

## 8. Endpoints da API — Resumo Completo

```
POST   /auth/login
POST   /auth/login-pin
POST   /auth/refresh

GET    /usuarios
POST   /usuarios
PUT    /usuarios/:id

GET    /mesas
POST   /mesas
PUT    /mesas/:id
DELETE /mesas/:id

GET    /pedidos?status=&mesa_id=
POST   /pedidos
GET    /pedidos/:id
PATCH  /pedidos/:id/fechar
PATCH  /pedidos/:id/cancelar
PATCH  /pedidos/:id/status-entrega

GET    /pedidos/:pedidoId/itens
POST   /pedidos/:pedidoId/itens
PATCH  /pedidos/:pedidoId/itens/:id/status

GET    /clientes?busca=
POST   /clientes
GET    /clientes/:id
PUT    /clientes/:id
DELETE /clientes/:id

GET    /produtos?busca=&categoria=
POST   /produtos
PUT    /produtos/:id
POST   /produtos/:id/imagem
DELETE /produtos/:id

GET    /financeiro/resumo-diario?data=YYYY-MM-DD
GET    /financeiro/historico
GET    /financeiro/dashboard

GET    /caixa/atual
POST   /caixa/abrir
PATCH  /caixa/:id/fechar
POST   /caixa/:id/movimentacao
```

---

## 9. Eventos WebSocket

| Evento                  | Direção       | Descrição |
|-------------------------|---------------|-----------|
| `join:kitchen`          | client→server | Entrar na sala de cozinha |
| `join:waiter`           | client→server | Entrar na sala de garçom |
| `join:tables`           | client→server | Entrar na sala de mesas |
| `mesa:statusChanged`    | server→client | Mesa mudou de status |
| `order:newItems`        | server→client | Novos itens adicionados ao pedido |
| `order:closed`          | server→client | Pedido fechado/pago |
| `item:statusChanged`    | server→client | Status de preparo de item alterado |
| `item:ready`            | server→client | Item marcado como PRONTO |
