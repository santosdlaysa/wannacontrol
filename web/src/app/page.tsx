import Link from 'next/link';
import LandingInteractiveDemo from '@/components/LandingInteractiveDemo';
import AdminDemoWidget from '@/components/AdminDemoWidget';

const modules = [
  {
    title: 'Pedidos e mesas',
    text: 'Abra pedidos, acompanhe consumo por mesa e feche contas sem perder o controle do salao.',
  },
  {
    title: 'Cardapio digital',
    text: 'Receba pedidos pelo link publico, cadastre clientes automaticamente e identifique cada pedido pelo numero.',
  },
  {
    title: 'Cozinha em tempo real',
    text: 'A equipe da cozinha ve novos itens, muda o status de preparo e avisa quando esta pronto.',
  },
  {
    title: 'Delivery e retirada',
    text: 'Organize entregas, retirada no balcao, dados do cliente, endereco e historico de pedidos.',
  },
  {
    title: 'Caixa e financeiro',
    text: 'Acompanhe faturamento diario, pedidos pagos, movimentacoes de caixa e resumo financeiro.',
  },
  {
    title: 'Gestao completa',
    text: 'Controle produtos, categorias, complementos, clientes, usuarios, entregadores e configuracoes.',
  },
];

const numbers = [
  ['1 link', 'para vender online'],
  ['Tempo real', 'entre salao, caixa e cozinha'],
  ['Multiequipe', 'perfis para cada funcao'],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <section className="relative min-h-[92vh] overflow-hidden bg-cafe-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1800&q=85"
          alt="Equipe atendendo clientes em cafeteria"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col px-5 py-5 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-black tracking-tight">
              ChefFlow
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-white/82 md:flex">
              <a href="#demo" className="hover:text-white">Demo</a>
              <a href="#modulos" className="hover:text-white">Modulos</a>
              <a href="#operacao" className="hover:text-white">Operacao</a>
              <a href="#planos" className="hover:text-white">Planos</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
              >
                Entrar
              </Link>
              <a
                href="https://wa.me/5595999999999?text=Quero%20conhecer%20o%20ChefFlow"
                className="rounded-lg bg-white px-4 py-2 text-sm font-black text-cafe-900 hover:bg-cafe-50"
              >
                Falar no WhatsApp
              </a>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-cafe-100">
                Sistema para cafeterias, restaurantes e delivery
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
                ChefFlow vende, organiza e mostra tudo em tempo real.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86">
                Controle mesas, cardapio digital, pedidos online, cozinha, delivery,
                clientes, caixa e financeiro em uma unica operacao.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://wa.me/5595999999999?text=Quero%20uma%20demonstracao%20do%20ChefFlow"
                  className="inline-flex justify-center rounded-lg bg-cafe-100 px-6 py-4 text-base font-black text-cafe-900 hover:bg-white"
                >
                  Agendar demonstracao
                </a>
                <Link
                  href="/cardapio/cozinha-da-daika"
                  className="inline-flex justify-center rounded-lg border border-white/40 px-6 py-4 text-base font-black text-white hover:bg-white/10"
                >
                  Ver cardapio publico
                </Link>
              </div>
            </div>

            <AdminDemoWidget minHeight={460} />
          </div>

          <div className="grid gap-3 pb-4 sm:grid-cols-3">
            {numbers.map(([value, label]) => (
              <div key={value} className="border-t border-white/24 pt-3">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-sm text-white/74">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingInteractiveDemo />

      <section id="modulos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-700">Modulos</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal text-gray-950">
            O sistema cobre a venda inteira, do pedido ao caixa.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((item) => (
            <article key={item.title} className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-black text-gray-950">{item.title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="operacao" className="bg-gray-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
          <img
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85"
            alt="Balcao de cafeteria em operacao"
            className="h-[420px] w-full rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-200">
              Operacao conectada
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">
              O pedido entra no cardapio, aparece no painel e segue para a cozinha.
            </h2>
            <div className="mt-8 space-y-5">
              {[
                'Cliente faz o pedido pelo link publico do restaurante.',
                'Cadastro e historico do cliente sao criados automaticamente.',
                'Equipe acompanha preparo, entrega, pagamento e financeiro.',
              ].map((text, index) => (
                <div key={text} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cafe-100 text-sm font-black text-cafe-900">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-lg text-white/82">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-700">
              Venda mais com controle
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">
              Uma implantacao direta para o seu restaurante operar melhor.
            </h2>
            <p className="mt-5 leading-8 text-gray-600">
              Ideal para quem precisa sair do improviso, receber pedidos online e
              enxergar a operacao em tempo real.
            </p>
          </div>
          <div className="rounded-lg border border-cafe-200 bg-cafe-50 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase text-cafe-700">Plano sob medida</p>
                <h3 className="mt-2 text-3xl font-black text-gray-950">
                  Demonstre seu fluxo e receba a proposta.
                </h3>
              </div>
              <a
                href="https://wa.me/5595999999999?text=Quero%20uma%20proposta%20do%20ChefFlow"
                className="rounded-lg bg-cafe-800 px-5 py-4 text-center font-black text-white hover:bg-cafe-900"
              >
                Chamar vendas
              </a>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Treinamento rapido', 'Cardapio online', 'Suporte de implantacao'].map((item) => (
                <div key={item} className="rounded-lg bg-white p-4 text-sm font-bold text-gray-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
