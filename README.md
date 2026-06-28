# ChefFlow — Sistema de gestão para restaurantes e Delivery

Sistema SaaS completo para restaurantes que trabalham com **atendimento em mesas**, **delivery** e **retirada**. Permite receber pedidos, enviar para a cozinha em tempo real, controlar o financeiro e acompanhar as vendas.

---

## Visão Geral

```
wannacontrol/
├── api/          # Backend Node.js + Express + Prisma
├── mobile/       # App React Native (Expo)
├── packages/
│   └── shared/   # Tipos, enums e validators compartilhados
└── docker-compose.yml
```

---

## Tecnologias

| Camada | Stack |
|---|---|
| **Backend** | Node.js, Express, TypeScript |
| **Banco de dados** | PostgreSQL + Prisma ORM |
| **Tempo real** | Socket.IO |
| **Autenticação** | JWT (access + refresh token) + PIN |
| **Mobile** | React Native, Expo SDK 53, Expo Router |
| **Infraestrutura** | Docker (banco local), Vercel (deploy API) |

---

## Funcionalidades

### Pedidos
- Abertura de pedido por mesa, delivery ou retirada
- Envio automático para a cozinha via WebSocket
- Acompanhamento de status de cada item (Pendente → Em preparo → Pronto → Entregue)
- Fechamento de conta com forma de pagamento e taxa de entrega
- Cancelamento de pedidos

### Clientes
- Cadastro completo (nome, telefone, endereço, bairro, cidade)
- Histórico de pedidos por cliente
- Busca por nome ou telefone

### Cozinha
- Tela dedicada com todos os itens pendentes/em preparo
- Avanço de status com um toque
- Atualização em tempo real via socket

### Financeiro
- Dashboard com pedidos do dia, em preparo, prontos e faturamento
- Resumo diário com top produtos e vendas por garçom
- Histórico de pedidos por período
- Controle de caixa (abertura, fechamento, sangria e suprimento)
- Ticket médio

### Usuários e Permissões
| Perfil | Acesso |
|---|---|
| **ADMIN** | Tudo |
| **GERENTE** | Pedidos, financeiro, usuários |
| **CAIXA** | Caixa, pedidos, financeiro |
| **GARCOM** | Mesas, pedidos, alertas |
| **COZINHA** | Tela da cozinha |

---

## Telas do App Mobile

| Tela | Perfis que visualizam |
|---|---|
| Dashboard | Todos exceto COZINHA |
| Mesas | Todos exceto COZINHA |
| Novo Pedido | Todos exceto COZINHA |
| Cozinha | COZINHA, ADMIN, GERENTE |
| Alertas (itens prontos) | Todos exceto COZINHA |
| Clientes | Todos exceto COZINHA |
| Perfil / Turno | Todos |

---

## Configuração Local

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd wannacontrol

# Instalar dependências do shared
cd packages/shared && npm install && npm run build && cd ../..

# Instalar dependências da API
cd api && npm install && cd ..

# Instalar dependências do mobile
cd mobile && npm install && cd ..
```

---

### 2. Subir o banco de dados

```bash
docker-compose up -d
```

Isso sobe:
- **PostgreSQL** na porta `5432`
- **pgAdmin** em `http://localhost:5050` (admin@chefflow.com / admin123)

---

### 3. Configurar variáveis de ambiente

```bash
cp .env.example api/.env
```

Conteúdo padrão do `.env`:

```env
DATABASE_URL=postgresql://chefflow:chefflow_dev@localhost:5432/chefflow
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3333
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

---

### 4. Rodar as migrations e seed

```bash
cd api
npx prisma migrate deploy
npm run seed
```

O seed cria os seguintes usuários de teste:

| Perfil | E-mail | Senha | PIN |
|---|---|---|---|
| Admin | admin@chefflow.com | admin123 | 000000 |
| Garçom | garcom@chefflow.com | garcom123 | 111111 |
| Cozinha | cozinha@chefflow.com | cozinha123 | 222222 |
| Caixa | caixa@chefflow.com | caixa123 | 333333 |

Também cria 10 mesas e 18 produtos de exemplo.

---

### 5. Iniciar a API

```bash
cd api
npm run dev
# API disponível em http://localhost:3333
```

---

### 6. Iniciar o app mobile

```bash
cd mobile
npm start
# Escanear o QR code com Expo Go (Android/iOS)
```

---

## Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/v1/auth/login` | Login com e-mail e senha |
| POST | `/api/v1/auth/login/pin` | Login com PIN |
| POST | `/api/v1/auth/refresh` | Renovar access token |

### Pedidos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/v1/pedidos` | Listar pedidos (filtro: status, mesa_id) |
| GET | `/api/v1/pedidos/:id` | Buscar pedido |
| POST | `/api/v1/pedidos` | Criar pedido (mesa, delivery ou retirada) |
| PATCH | `/api/v1/pedidos/:id/fechar` | Fechar e registrar pagamento |
| PATCH | `/api/v1/pedidos/:id/cancelar` | Cancelar pedido |
| POST | `/api/v1/pedidos/:id/itens` | Adicionar itens |
| PATCH | `/api/v1/pedidos/:pedidoId/itens/:id/status` | Atualizar status de preparo |

### Clientes
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/v1/clientes` | Listar (busca por nome/telefone) |
| GET | `/api/v1/clientes/:id` | Buscar com histórico |
| POST | `/api/v1/clientes` | Cadastrar |
| PUT | `/api/v1/clientes/:id` | Atualizar |
| DELETE | `/api/v1/clientes/:id` | Remover |

### Financeiro
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/v1/financeiro/dashboard` | Resumo em tempo real (todos os perfis) |
| GET | `/api/v1/financeiro/resumo-diario` | Resumo detalhado do dia (ADMIN/GERENTE/CAIXA) |
| GET | `/api/v1/financeiro/historico` | Histórico por período |

### Outros
| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/v1/produtos` | Gestão de produtos |
| GET/POST/PUT | `/api/v1/mesas` | Gestão de mesas |
| GET/POST | `/api/v1/caixa` | Controle de caixa |
| GET/POST/PUT/DELETE | `/api/v1/usuarios` | Gestão de usuários |

---

## Eventos WebSocket

| Evento | Direção | Descrição |
|---|---|---|
| `item:statusChanged` | Server → Client | Status de item atualizado |
| `item:ready` | Server → Client | Item pronto para entrega |
| `mesa:statusChanged` | Server → Client | Status da mesa mudou |
| `order:newItems` | Server → Client | Novos itens adicionados ao pedido |
| `order:closed` | Server → Client | Pedido fechado |
| `room:joinKitchen` | Client → Server | Entrar na sala da cozinha |
| `room:joinWaiter` | Client → Server | Entrar na sala de garçom |

---

## Banco de Dados — Modelos Principais

```
Usuario          → perfil: ADMIN | GERENTE | CAIXA | GARCOM | COZINHA
Cliente          → nome, telefone, endereço, bairro, cidade
Mesa             → numero, status: LIVRE | OCUPADA | AGUARDANDO_CONTA
Produto          → nome, preco, categoria, disponivel
Pedido           → tipo: MESA | DELIVERY | RETIRADA
                   status: ABERTO | PAGO | CANCELADO
                   statusEntrega: RECEBIDO | CONFIRMADO | EM_PREPARO |
                                  PRONTO | SAIU_ENTREGA | ENTREGUE | CANCELADO
ItemPedido       → statusPreparo: PENDENTE | PREPARANDO | PRONTO | ENTREGUE
Caixa            → valorInicial, valorFinal, totalVendas
MovimentacaoCaixa → tipo: SANGRIA | SUPRIMENTO
```

---

## Deploy

A API está configurada para deploy no **Vercel** e o banco de dados em qualquer PostgreSQL (Railway, Supabase, Render, etc.).

Basta configurar a variável `DATABASE_URL` no ambiente de produção e executar:

```bash
cd api
npx prisma migrate deploy
npm run build
```

---

## Estrutura de Arquivos (resumida)

```
api/src/
├── modules/
│   ├── auth/           # Login, JWT, refresh token
│   ├── clientes/       # CRUD de clientes
│   ├── financeiro/     # Dashboard, resumo diário, histórico
│   ├── caixa/          # Controle de caixa
│   ├── mesas/          # Gestão de mesas
│   ├── pedidos/        # Pedidos (mesa, delivery, retirada)
│   ├── itens-pedido/   # Itens e status de preparo
│   ├── produtos/       # Cardápio
│   └── usuarios/       # Usuários e permissões
├── middlewares/        # auth, authorize, validate, upload
└── lib/               # prisma, socket, errors, async-handler

mobile/app/
├── (tabs)/
│   ├── dashboard.tsx   # Resumo do dia em tempo real
│   ├── mesas.tsx       # Grid de mesas
│   ├── novo-pedido.tsx # Criação de pedido com carrinho
│   ├── cozinha.tsx     # Tela da cozinha
│   ├── alertas.tsx     # Itens prontos para entregar
│   ├── clientes.tsx    # Cadastro de clientes
│   └── perfil.tsx      # Perfil e resumo do turno
└── pedido/
    └── [id].tsx        # Detalhe e fechamento de pedido
```
