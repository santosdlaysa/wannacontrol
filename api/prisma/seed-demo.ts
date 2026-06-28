import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Demo restaurant seed starting...');

  const restaurante = await prisma.restaurante.upsert({
    where: { slug: 'chefflow-demo' },
    update: {},
    create: {
      nome: 'ChefFlow Demo',
      slug: 'chefflow-demo',
      telefone: '(11) 99000-0000',
      plano: 'PROFISSIONAL',
      ativo: true,
    },
  });
  console.log(`Restaurante: ${restaurante.nome} (id=${restaurante.id})`);

  const senhaHash = await bcrypt.hash('demo123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'demo@chefflow.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Admin Demo',
      email: 'demo@chefflow.com',
      senhaHash,
      pin: '900000',
      perfil: 'ADMIN',
      ativo: true,
    },
  });

  const garcom = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'garcom@demo.chefflow.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Garcom Demo',
      email: 'garcom@demo.chefflow.com',
      senhaHash: await bcrypt.hash('demo123', 10),
      pin: '900001',
      perfil: 'GARCOM',
      ativo: true,
    },
  });

  const cozinha = await prisma.usuario.upsert({
    where: { email_restauranteId: { email: 'cozinha@demo.chefflow.com', restauranteId: restaurante.id } },
    update: {},
    create: {
      restauranteId: restaurante.id,
      nome: 'Cozinheiro Demo',
      email: 'cozinha@demo.chefflow.com',
      senhaHash: await bcrypt.hash('demo123', 10),
      pin: '900002',
      perfil: 'COZINHA',
      ativo: true,
    },
  });

  console.log(`Usuarios: ${admin.email} / ${garcom.email} / ${cozinha.email} (senha: demo123)`);

  // Mesas
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.mesa.findFirst({ where: { restauranteId: restaurante.id, numero: i } });
    if (!existing) {
      await prisma.mesa.create({ data: { restauranteId: restaurante.id, numero: i, status: 'LIVRE' } });
    }
  }
  console.log('10 mesas criadas');

  // Categorias
  async function upsertCategoria(nome: string, descricao: string, ordem: number) {
    const existing = await prisma.categoria.findFirst({ where: { restauranteId: restaurante.id, nome } });
    if (existing) return existing;
    return prisma.categoria.create({ data: { restauranteId: restaurante.id, nome, descricao, ativo: true, ordem } });
  }

  const catMarmitas = await upsertCategoria('Marmitas', 'Marmitas caseiras feitas na hora', 1);
  const catAcompanhamentos = await upsertCategoria('Acompanhamentos', 'Acompanhamentos para complementar sua refeicao', 2);
  console.log(`Categorias: Marmitas (id=${catMarmitas.id}), Acompanhamentos (id=${catAcompanhamentos.id})`);

  // Produtos — Marmitas
  const marmitas = [
    { nome: 'Frango Grelhado', descricao: 'Frango grelhado temperado com alho e ervas. Acompanha arroz, feijao e salada.', preco: 30.0 },
    { nome: 'Frango Empanado', descricao: 'Frango empanado crocante. Acompanha arroz, feijao e salada.', preco: 30.0 },
    { nome: 'Assado de Panela', descricao: 'Carne assada na panela com molho. Acompanha arroz, feijao e salada.', preco: 30.0 },
    { nome: 'Costelinha de Porco', descricao: 'Costelinha de porco ao molho. Acompanha arroz, feijao e salada.', preco: 30.0 },
    { nome: 'Carne Moida com Legumes', descricao: 'Carne moida refogada com legumes frescos. Acompanha arroz e feijao.', preco: 30.0 },
    { nome: 'Bife Acebolado', descricao: 'Bife com cebola caramelizada. Acompanha arroz, feijao e salada.', preco: 30.0 },
    { nome: 'Marmita Saudavel', descricao: 'Peito de frango grelhado com salada de legumes e pure de batata.', preco: 30.0 },
    { nome: 'Panqueca', descricao: 'Panqueca de frango desfiado ou carne moida com molho de tomate.', preco: 30.0 },
    { nome: 'Strogonoff de Carne', descricao: 'Strogonoff de carne ao molho cremoso. Acompanha arroz e batata palha.', preco: 30.0 },
    { nome: 'Lasanha de Carne', descricao: 'Lasanha de carne ao molho bolonhesa com queijo gratinado.', preco: 30.0 },
    { nome: 'Almondega ao Molho', descricao: 'Almondegas artesanais ao molho de tomate. Acompanha arroz e macarrao.', preco: 30.0 },
    { nome: 'Frango Desfiado', descricao: 'Frango desfiado temperado ao molho. Acompanha arroz, feijao e salada.', preco: 30.0 },
  ];

  // Produtos — Acompanhamentos
  const acompanhamentos = [
    { nome: 'Arroz', descricao: 'Arroz branco cozido no ponto certo.', preco: 0.0 },
    { nome: 'Feijao', descricao: 'Feijao carioca temperado.', preco: 0.0 },
    { nome: 'Macarrao', descricao: 'Macarrao ao alho e oleo.', preco: 0.0 },
    { nome: 'Pure de Batata', descricao: 'Pure de batata cremoso.', preco: 0.0 },
    { nome: 'Salada de Legumes', descricao: 'Mix de legumes frescos temperados.', preco: 0.0 },
    { nome: 'Farofa', descricao: 'Farofa caseira crocante.', preco: 0.0 },
  ];

  let totalProdutos = 0;
  for (const m of marmitas) {
    const existing = await prisma.produto.findFirst({ where: { restauranteId: restaurante.id, nome: m.nome } });
    if (!existing) {
      await prisma.produto.create({
        data: { restauranteId: restaurante.id, categoriaId: catMarmitas.id, nome: m.nome, descricao: m.descricao, preco: m.preco, categoria: 'Marmitas', disponivel: true },
      });
      totalProdutos++;
    }
  }
  for (const a of acompanhamentos) {
    const existing = await prisma.produto.findFirst({ where: { restauranteId: restaurante.id, nome: a.nome } });
    if (!existing) {
      await prisma.produto.create({
        data: { restauranteId: restaurante.id, categoriaId: catAcompanhamentos.id, nome: a.nome, descricao: a.descricao, preco: a.preco, categoria: 'Acompanhamentos', disponivel: true },
      });
      totalProdutos++;
    }
  }
  console.log(`Produtos criados: ${totalProdutos}`);

  // Configuracoes
  const configs = [
    { chave: 'aceita_delivery', valor: 'true' },
    { chave: 'aceita_retirada', valor: 'true' },
    { chave: 'taxa_entrega', valor: '5.00' },
    { chave: 'tempo_preparo_medio', valor: '40' },
    { chave: 'horario_abertura', valor: '10:00' },
    { chave: 'horario_fechamento', valor: '22:00' },
    { chave: 'mensagem_boas_vindas', valor: 'Bem-vindo ao ChefFlow Demo! Explore o sistema.' },
    { chave: 'percentual_servico', valor: '0' },
    { chave: 'restaurante_aberto', valor: 'true' },
  ];

  for (const c of configs) {
    await prisma.configuracao.upsert({
      where: { restauranteId_chave: { restauranteId: restaurante.id, chave: c.chave } },
      update: { valor: c.valor },
      create: { restauranteId: restaurante.id, chave: c.chave, valor: c.valor },
    });
  }
  console.log('Configuracoes aplicadas');

  console.log('\n==============================================');
  console.log('  CHEFFLOW DEMO — SETUP COMPLETO');
  console.log('==============================================');
  console.log(`  Slug     : ${restaurante.slug}`);
  console.log('  LOGINS:');
  console.log(`    Admin  → demo@chefflow.com  / demo123  / PIN: 900000`);
  console.log(`    Garcom → garcom@demo...      / demo123  / PIN: 900001`);
  console.log(`    Cozinha→ cozinha@demo...     / demo123  / PIN: 900002`);
  console.log('==============================================\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed-demo:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
