import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'cozinha-da-daika';

const BAIRROS = [
  'Aeroporto',
  'Alvorada',
  'Asa Branca',
  'Bela Vista',
  'Buritis',
  'Caçari',
  'Caimbé',
  'Calungá',
  'Cambará',
  'Canarinho',
  'Caranã',
  'Cauamé',
  'Centenário',
  'Centro',
  'Cidade Satélite',
  'Cinturão Verde',
  'Distrito Industrial',
  'Distrito Industrial Governador Aquilino Mota Duarte',
  'Doutor Sílvio Botelho',
  'Doutor Sílvio Leite',
  'Dr. Airton Rocha',
  'Equatorial',
  'Estados',
  'Felix Valois de Araújo',
  'Governador Aquilino Mota',
  'Governador Aquilino Mota Duarte',
  'Industrial',
  'Jardim Caranã',
  'Jardim Floresta',
  'Jardim Primavera',
  'Jardim Tropical',
  'Jóquei Clube',
  'Laura Moreira',
  'Liberdade',
  'Marechal Rondon',
  'Mecejana',
  'Murilo Teixeira Cidade',
  'Nossa Senhora Aparecida',
  'Nova Canaã',
  'Nova Cidade',
  'Olímpico',
  'Operário',
  'Paraviana',
  'Pintolândia',
  'Piscicultura',
  'Pricumã',
  'Professora Araceli Souto Maior',
  'Raiar do Sol',
  'Said Salomão',
  'Santa Luzia',
  'Santa Tereza',
  'São Bento',
  'São Francisco',
  'São Pedro',
  'São Vicente',
  'Senador Hélio Campos',
  'Silvio Botelho',
  'Silvio Leite',
  'Tancredo Neves',
  'Treze de Setembro',
  'Trinta e Um de Março',
  'União',
];

async function main() {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug: SLUG },
    select: { id: true, nome: true },
  });

  if (!restaurante) {
    console.error(`Restaurante com slug "${SLUG}" não encontrado.`);
    process.exit(1);
  }

  console.log(`Restaurante: ${restaurante.nome} (id=${restaurante.id})`);
  console.log(`Inserindo ${BAIRROS.length} bairros...`);

  let criados = 0;
  let ignorados = 0;

  for (const bairro of BAIRROS) {
    const existente = await prisma.taxaEntregaBairro.findFirst({
      where: { restauranteId: restaurante.id, bairro },
    });

    if (existente) {
      ignorados++;
      continue;
    }

    await prisma.taxaEntregaBairro.create({
      data: {
        restauranteId: restaurante.id,
        bairro,
        taxa: 0,
        ativo: true,
      },
    });
    criados++;
  }

  console.log(`Concluído: ${criados} criados, ${ignorados} já existiam.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
