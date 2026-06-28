import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🍱 Criando Cozinha da Daika...');

  // ─── Restaurante ────────────────────────────────────────────────────────────
  const restaurante = await prisma.restaurante.upsert({
    where: { slug: 'cozinha-da-daika' },
    update: {},
    create: {
      nome: 'Cozinha da Daika',
      slug: 'cozinha-da-daika',
      telefone: '(95) 99145-6708',
      plano: 'BASICO',
      ativo: true,
    },
  });
  console.log(`✅ Restaurante: ${restaurante.nome} (id=${restaurante.id})`);

  // ─── Usuários ────────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('daika123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'admin@daika.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Daika Admin',
      email: 'admin@daika.com',
      senhaHash,
      pin: '100000',
      perfil: 'ADMIN',
      ativo: true,
    },
  });

  const garcom = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'garcom@daika.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Atendente',
      email: 'garcom@daika.com',
      senhaHash: await bcrypt.hash('daika123', 10),
      pin: '100001',
      perfil: 'GARCOM',
      ativo: true,
    },
  });

  const cozinha = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'cozinha@daika.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Cozinheira',
      email: 'cozinha@daika.com',
      senhaHash: await bcrypt.hash('daika123', 10),
      pin: '100002',
      perfil: 'COZINHA',
      ativo: true,
    },
  });

  console.log(`✅ Usuários: admin@daika.com / garcom@daika.com / cozinha@daika.com (senha: daika123)`);
  console.log(`   PINs: ${admin.pin} / ${garcom.pin} / ${cozinha.pin}`);

  // ─── Categorias ──────────────────────────────────────────────────────────────
  const catMarmitas = await prisma.categoria.upsert({
    where: { id: (await prisma.categoria.findFirst({ where: { restauranteId: restaurante.id, nome: 'Marmitas' } }))?.id ?? 0 },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Marmitas',
      descricao: 'Marmitas caseiras feitas na hora com muito carinho',
      ativo: true,
      ordem: 1,
    },
  });

  const catAcompanhamentos = await prisma.categoria.upsert({
    where: { id: (await prisma.categoria.findFirst({ where: { restauranteId: restaurante.id, nome: 'Acompanhamentos' } }))?.id ?? 0 },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Acompanhamentos',
      descricao: 'Acompanhamentos para complementar sua refeição',
      ativo: true,
      ordem: 2,
    },
  });

  console.log(`✅ Categorias: Marmitas (id=${catMarmitas.id}), Acompanhamentos (id=${catAcompanhamentos.id})`);

  // ─── Produtos — Marmitas ─────────────────────────────────────────────────────
  const marmitas = [
    {
      nome: 'Frango Grelhado',
      descricao: 'Frango grelhado temperado com alho e ervas. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
    {
      nome: 'Frango Empanado',
      descricao: 'Frango empanado crocante. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
    {
      nome: 'Assado de Panela',
      descricao: 'Carne assada na panela com molho. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
    {
      nome: 'Costelinha de Porco',
      descricao: 'Costelinha de porco ao molho. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
    {
      nome: 'Carne Moída com Legumes',
      descricao: 'Carne moída refogada com legumes frescos. Acompanha arroz e feijão.',
      preco: 30.00,
    },
    {
      nome: 'Bife Acebolado',
      descricao: 'Bife com cebola caramelizada. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
    {
      nome: 'Marmita Saudável',
      descricao: 'Peito de frango grelhado ou patinho moído com salada de legumes e purê de batata.',
      preco: 30.00,
    },
    {
      nome: 'Panqueca',
      descricao: 'Panqueca de frango desfiado ou carne moída com molho de tomate.',
      preco: 30.00,
    },
    {
      nome: 'Strogonoff de Carne',
      descricao: 'Strogonoff de carne ao molho cremoso. Acompanha arroz e batata palha.',
      preco: 30.00,
    },
    {
      nome: 'Escondidinho de Carne',
      descricao: 'Escondidinho de carne moída com purê de mandioca gratinado.',
      preco: 30.00,
    },
    {
      nome: 'Lasanha de Carne',
      descricao: 'Lasanha de carne ao molho bolonhesa com queijo gratinado.',
      preco: 30.00,
    },
    {
      nome: 'Omelete Recheado',
      descricao: 'Omelete recheado com carne e frango desfiado. Acompanha arroz e salada.',
      preco: 30.00,
    },
    {
      nome: 'Almôndegas ao Molho de Tomate',
      descricao: 'Almôndegas artesanais ao molho de tomate. Acompanha arroz e macarrão.',
      preco: 30.00,
    },
    {
      nome: 'Frango Desfiado',
      descricao: 'Frango desfiado temperado ao molho. Acompanha arroz, feijão e salada.',
      preco: 30.00,
    },
  ];

  // ─── Produtos — Acompanhamentos ───────────────────────────────────────────────
  const acompanhamentos = [
    { nome: 'Arroz',              descricao: 'Arroz branco cozido no ponto certo.',       preco: 0.00 },
    { nome: 'Feijão',             descricao: 'Feijão carioca temperado.',                  preco: 0.00 },
    { nome: 'Macarrão',           descricao: 'Macarrão ao alho e óleo.',                  preco: 0.00 },
    { nome: 'Purê de Batata',     descricao: 'Purê de batata cremoso.',                    preco: 0.00 },
    { nome: 'Salada de Legumes',  descricao: 'Mix de legumes frescos temperados.',         preco: 0.00 },
    { nome: 'Farofa',             descricao: 'Farofa caseira crocante.',                   preco: 0.00 },
  ];

  // Criar marmitas
  let totalProdutos = 0;
  for (const m of marmitas) {
    const existing = await prisma.produto.findFirst({
      where: { restauranteId: restaurante.id, nome: m.nome },
    });
    if (!existing) {
      await prisma.produto.create({
        data: {
          restauranteId: restaurante.id,
          categoriaId: catMarmitas.id,
          nome: m.nome,
          descricao: m.descricao,
          preco: m.preco,
          categoria: 'Marmitas',
          disponivel: true,
        },
      });
      totalProdutos++;
    }
  }

  // Criar acompanhamentos
  for (const a of acompanhamentos) {
    const existing = await prisma.produto.findFirst({
      where: { restauranteId: restaurante.id, nome: a.nome },
    });
    if (!existing) {
      await prisma.produto.create({
        data: {
          restauranteId: restaurante.id,
          categoriaId: catAcompanhamentos.id,
          nome: a.nome,
          descricao: a.descricao,
          preco: a.preco,
          categoria: 'Acompanhamentos',
          disponivel: true,
        },
      });
      totalProdutos++;
    }
  }

  console.log(`✅ Produtos criados: ${totalProdutos} (${marmitas.length} marmitas + ${acompanhamentos.length} acompanhamentos)`);

  // ─── Configurações ────────────────────────────────────────────────────────────
  const configs = [
    { chave: 'aceita_delivery', valor: 'true' },
    { chave: 'aceita_retirada', valor: 'true' },
    { chave: 'taxa_entrega', valor: '5.00' },
    { chave: 'tempo_preparo_medio', valor: '40' },
    { chave: 'horario_abertura', valor: '10:00' },
    { chave: 'horario_fechamento', valor: '21:00' },
    { chave: 'mensagem_boas_vindas', valor: 'Bem-vindo à Cozinha da Daika! Marmitas caseiras com muito carinho. 🍱' },
    { chave: 'percentual_servico', valor: '0' },
  ];

  for (const c of configs) {
    await prisma.configuracao.upsert({
      where: { restauranteId_chave: { restauranteId: restaurante.id, chave: c.chave } },
      update: { valor: c.valor },
      create: { restauranteId: restaurante.id, chave: c.chave, valor: c.valor },
    });
  }
  console.log(`✅ Configurações aplicadas`);

  // ─── Resumo ───────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  COZINHA DA DAIKA — SETUP COMPLETO');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Restaurante ID : ${restaurante.id}`);
  console.log(`  Slug           : ${restaurante.slug}`);
  console.log(`  Telefone       : ${restaurante.telefone}`);
  console.log('');
  console.log('  LOGINS:');
  console.log(`    Admin    → admin@daika.com    / daika123  / PIN: 100000`);
  console.log(`    Atendente→ garcom@daika.com   / daika123  / PIN: 100001`);
  console.log(`    Cozinha  → cozinha@daika.com  / daika123  / PIN: 100002`);
  console.log('');
  console.log(`  CATEGORIAS   : Marmitas, Acompanhamentos`);
  console.log(`  PRODUTOS     : ${marmitas.length} marmitas + ${acompanhamentos.length} acompanhamentos`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
