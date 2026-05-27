import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Criar usuario admin
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cafecontrol.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@cafecontrol.com',
      senhaHash,
      pin: '000000',
      perfil: 'ADMIN',
    },
  });
  console.log(`Admin criado: ${admin.email}`);

  // Criar garcom de exemplo
  const garcomHash = await bcrypt.hash('garcom123', 10);
  const garcom = await prisma.usuario.upsert({
    where: { email: 'garcom@cafecontrol.com' },
    update: {},
    create: {
      nome: 'João Garçom',
      email: 'garcom@cafecontrol.com',
      senhaHash: garcomHash,
      pin: '111111',
      perfil: 'GARCOM',
    },
  });
  console.log(`Garçom criado: ${garcom.email}`);

  // Criar cozinheiro de exemplo
  const cozinhaHash = await bcrypt.hash('cozinha123', 10);
  const cozinheiro = await prisma.usuario.upsert({
    where: { email: 'cozinha@cafecontrol.com' },
    update: {},
    create: {
      nome: 'Maria Cozinha',
      email: 'cozinha@cafecontrol.com',
      senhaHash: cozinhaHash,
      pin: '222222',
      perfil: 'COZINHA',
    },
  });
  console.log(`Cozinheiro criado: ${cozinheiro.email}`);

  // Criar caixa de exemplo
  const caixaHash = await bcrypt.hash('caixa123', 10);
  const caixa = await prisma.usuario.upsert({
    where: { email: 'caixa@cafecontrol.com' },
    update: {},
    create: {
      nome: 'Ana Caixa',
      email: 'caixa@cafecontrol.com',
      senhaHash: caixaHash,
      pin: '333333',
      perfil: 'CAIXA',
    },
  });
  console.log(`Caixa criado: ${caixa.email}`);

  // Criar 10 mesas
  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: { numero: i, status: 'LIVRE' },
    });
  }
  console.log('10 mesas criadas');

  // Criar produtos
  const produtos = [
    // Cafés Quentes
    { nome: 'Espresso', descricao: 'Café espresso tradicional 50ml', preco: 6.50, categoria: 'Cafés Quentes' },
    { nome: 'Cappuccino', descricao: 'Espresso com leite vaporizado e espuma', preco: 10.00, categoria: 'Cafés Quentes' },
    { nome: 'Latte', descricao: 'Espresso com bastante leite vaporizado', preco: 12.00, categoria: 'Cafés Quentes' },
    { nome: 'Mocha', descricao: 'Espresso com chocolate e leite vaporizado', preco: 14.00, categoria: 'Cafés Quentes' },
    { nome: 'Café Coado', descricao: 'Café coado na hora, 200ml', preco: 5.00, categoria: 'Cafés Quentes' },

    // Bebidas Geladas
    { nome: 'Iced Coffee', descricao: 'Café gelado com gelo, 300ml', preco: 12.00, categoria: 'Bebidas Geladas' },
    { nome: 'Frappuccino', descricao: 'Café batido com gelo e creme', preco: 16.00, categoria: 'Bebidas Geladas' },
    { nome: 'Suco de Laranja', descricao: 'Suco natural de laranja, 300ml', preco: 10.00, categoria: 'Bebidas Geladas' },
    { nome: 'Refrigerante Lata', descricao: 'Coca-Cola, Guaraná ou Sprite', preco: 7.00, categoria: 'Bebidas Geladas' },
    { nome: 'Água Mineral', descricao: 'Água mineral sem gás, 500ml', preco: 4.00, categoria: 'Bebidas Geladas' },

    // Salgados
    { nome: 'Pão de Queijo', descricao: 'Pão de queijo mineiro assado na hora', preco: 5.50, categoria: 'Salgados' },
    { nome: 'Coxinha', descricao: 'Coxinha de frango com catupiry', preco: 7.00, categoria: 'Salgados' },
    { nome: 'Misto Quente', descricao: 'Sanduíche de presunto e queijo na chapa', preco: 9.00, categoria: 'Salgados' },
    { nome: 'Croissant Recheado', descricao: 'Croissant com presunto e queijo', preco: 11.00, categoria: 'Salgados' },

    // Doces e Tortas
    { nome: 'Bolo de Cenoura', descricao: 'Fatia de bolo de cenoura com cobertura de chocolate', preco: 9.00, categoria: 'Doces e Tortas' },
    { nome: 'Cheesecake', descricao: 'Cheesecake de frutas vermelhas', preco: 14.00, categoria: 'Doces e Tortas' },
    { nome: 'Brownie', descricao: 'Brownie de chocolate com nozes', preco: 10.00, categoria: 'Doces e Tortas' },
    { nome: 'Torta de Limão', descricao: 'Fatia de torta de limão com merengue', preco: 12.00, categoria: 'Doces e Tortas' },
  ];

  for (const produto of produtos) {
    await prisma.produto.upsert({
      where: { id: produtos.indexOf(produto) + 1 },
      update: {},
      create: produto,
    });
  }
  console.log(`${produtos.length} produtos criados`);

  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
