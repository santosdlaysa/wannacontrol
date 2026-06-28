'use client';

import { useState } from 'react';
import Link from 'next/link';

type DemoMode = 'admin' | 'cliente';
type AdminScreen = 'dashboard' | 'pedidos' | 'cozinha' | 'clientes' | 'financeiro';

const adminOrders = [
  ['#1042', 'Delivery', 'Ana Paula', 'Recebido', 'R$ 68,90'],
  ['#1041', 'Mesa 08', 'Garcom Leo', 'Em preparo', 'R$ 124,40'],
  ['#1040', 'Retirada', 'Marcos Lima', 'Pronto', 'R$ 42,00'],
];

const clientItems = [
  ['Combo Daika', 'Cafe gelado, pao de queijo e bolo', 'R$ 32,90'],
  ['Cappuccino Cremoso', 'Chocolate, canela e espresso', 'R$ 14,90'],
  ['Tapioca Recheada', 'Queijo coalho e frango', 'R$ 18,50'],
];

const adminScreens: Array<{ id: AdminScreen; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'cozinha', label: 'Cozinha' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'financeiro', label: 'Financeiro' },
];

export default function LandingInteractiveDemo() {
  const [mode, setMode] = useState<DemoMode>('admin');
  const [adminScreen, setAdminScreen] = useState<AdminScreen>('dashboard');
  const [selectedItem, setSelectedItem] = useState(0);

  const adminTitle = adminScreens.find((screen) => screen.id === adminScreen)?.label ?? 'Dashboard';

  return (
    <section id="demo" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-700">
              Demonstracao interativa
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-gray-950">
              Veja como o sistema aparece para a equipe e para o cliente.
            </h2>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {[
              ['admin', 'Versao admin'],
              ['cliente', 'Versao cliente'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value as DemoMode)}
                className={`rounded-md px-4 py-2 text-sm font-black transition-colors ${
                  mode === value
                    ? 'bg-cafe-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-2xl font-black text-gray-950">
              {mode === 'admin' ? 'Painel administrativo' : 'Cardapio do cliente'}
            </h3>
            <p className="mt-3 leading-7 text-gray-600">
              {mode === 'admin'
                ? 'Acompanhe pedidos, cozinha, mesas, caixa e delivery no mesmo lugar, com status atualizados em tempo real.'
                : 'O cliente abre o link do restaurante, escolhe os produtos, informa os dados e recebe o numero do pedido.'}
            </p>
            <div className="mt-6 grid gap-3">
              {(mode === 'admin'
                ? ['Novo pedido entra no painel', 'Cozinha recebe itens', 'Caixa fecha e registra faturamento']
                : ['Cliente escolhe produtos', 'Cadastro e pedido sao gerados', 'Numero do pedido fica visivel']
              ).map((text, index) => (
                <div key={text} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cafe-100 text-sm font-black text-cafe-800">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={mode === 'admin' ? '/login' : '/cardapio/cozinha-da-daika'}
                className="rounded-lg bg-cafe-800 px-5 py-3 text-center text-sm font-black text-white hover:bg-cafe-900"
              >
                Abrir {mode === 'admin' ? 'admin' : 'cardapio'}
              </Link>
              <button
                onClick={() => setMode(mode === 'admin' ? 'cliente' : 'admin')}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-black text-gray-700 hover:bg-white"
              >
                Ver outra versao
              </button>
            </div>
          </div>

          {mode === 'admin' ? (
            <div className="rounded-lg border border-gray-900 bg-gray-950 p-3 shadow-2xl">
              <div className="rounded-md bg-gray-100">
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-400">Admin</p>
                    <p className="font-black text-gray-950">CafeControl {adminTitle}</p>
                  </div>
                  <span className="rounded-md bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    Ao vivo
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2">
                  {adminScreens.map((screen) => (
                    <button
                      key={screen.id}
                      onClick={() => setAdminScreen(screen.id)}
                      className={`shrink-0 rounded-md px-3 py-2 text-xs font-black transition-colors ${
                        adminScreen === screen.id
                          ? 'bg-cafe-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {screen.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {adminScreen === 'dashboard' && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-4">
                        {[
                          ['Pedidos', '18'],
                          ['Preparo', '7'],
                          ['Prontos', '4'],
                          ['Hoje', 'R$ 2.840'],
                        ].map(([label, value]) => (
                          <button
                            key={label}
                            onClick={() => {
                              if (label === 'Pedidos') setAdminScreen('pedidos');
                              if (label === 'Preparo' || label === 'Prontos') setAdminScreen('cozinha');
                              if (label === 'Hoje') setAdminScreen('financeiro');
                            }}
                            className="rounded-lg bg-white p-3 text-left transition hover:ring-2 hover:ring-cafe-300"
                          >
                            <p className="text-xs font-bold text-gray-500">{label}</p>
                            <p className="mt-1 text-xl font-black text-cafe-800">{value}</p>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          ['Mesas', '12 ocupadas'],
                          ['Delivery', '5 em rota'],
                          ['Caixa', 'Aberto desde 08:30'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg bg-white p-3">
                            <p className="font-black text-gray-800">{label}</p>
                            <p className="mt-1 text-xs text-gray-500">{value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {adminScreen === 'pedidos' && (
                    <div className="overflow-hidden rounded-lg bg-white">
                      {adminOrders.map(([id, type, name, status, total]) => (
                        <button
                          key={id}
                          onClick={() => setAdminScreen(type === 'Delivery' ? 'clientes' : 'cozinha')}
                          className="grid w-full grid-cols-[0.7fr_1fr_1.3fr_1fr_0.8fr] gap-2 border-b border-gray-100 px-3 py-3 text-left text-xs last:border-b-0 hover:bg-cafe-50 sm:text-sm"
                        >
                          <span className="font-black text-gray-950">{id}</span>
                          <span className="font-bold text-gray-600">{type}</span>
                          <span className="truncate text-gray-600">{name}</span>
                          <span className="truncate font-bold text-cafe-700">{status}</span>
                          <span className="text-right font-black text-gray-950">{total}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {adminScreen === 'cozinha' && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Pendente', 'Combo Daika', 'Pedido #1042'],
                        ['Preparando', 'Tapioca Recheada', 'Mesa 08'],
                        ['Pronto', 'Cappuccino Cremoso', 'Retirada'],
                      ].map(([status, item, origem]) => (
                        <div key={status} className="rounded-lg bg-white p-3">
                          <p className="text-xs font-black uppercase text-cafe-700">{status}</p>
                          <p className="mt-2 font-black text-gray-950">{item}</p>
                          <p className="mt-1 text-xs text-gray-500">{origem}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {adminScreen === 'clientes' && (
                    <div className="grid gap-3">
                      {[
                        ['Ana Paula', '(95) 99123-7788', '8 pedidos', 'R$ 486,20'],
                        ['Marcos Lima', '(95) 98444-1122', '3 pedidos', 'R$ 141,00'],
                        ['Carla Souza', '(95) 99910-2233', '12 pedidos', 'R$ 904,70'],
                      ].map(([name, phone, orders, total]) => (
                        <div key={phone} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-2 rounded-lg bg-white p-3 text-xs sm:text-sm">
                          <div>
                            <p className="font-black text-gray-950">{name}</p>
                            <p className="text-gray-500">{phone}</p>
                          </div>
                          <p className="font-bold text-gray-600">{orders}</p>
                          <p className="text-right font-black text-cafe-700">{total}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {adminScreen === 'financeiro' && (
                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          ['Faturamento hoje', 'R$ 2.840'],
                          ['Ticket medio', 'R$ 47,30'],
                          ['Pedidos pagos', '60'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg bg-white p-3">
                            <p className="text-xs font-bold text-gray-500">{label}</p>
                            <p className="mt-1 text-xl font-black text-green-700">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-sm font-black text-gray-950">Formas de pagamento</p>
                        <div className="mt-3 space-y-2">
                          {[
                            ['PIX', '48%'],
                            ['Credito', '31%'],
                            ['Debito', '14%'],
                            ['Dinheiro', '7%'],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <div className="mb-1 flex justify-between text-xs font-bold text-gray-600">
                                <span>{label}</span>
                                <span>{value}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-cafe-700" style={{ width: value }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-sm rounded-[28px] border border-gray-900 bg-gray-950 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[22px] bg-amber-50">
                <div className="bg-amber-600 px-4 py-5 text-white">
                  <p className="text-xs font-black uppercase text-amber-100">Cardapio online</p>
                  <h3 className="mt-1 text-2xl font-black">Cozinha da Daika</h3>
                  <p className="mt-1 text-sm text-amber-100">Delivery e retirada</p>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex gap-2 overflow-hidden">
                    {['Combos', 'Bebidas', 'Lanches'].map((item, index) => (
                      <button
                        key={item}
                        onClick={() => setSelectedItem(index)}
                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${
                          selectedItem === index
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-gray-600'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {clientItems.map(([name, desc, price], index) => (
                      <button
                        key={name}
                        onClick={() => setSelectedItem(index)}
                        className={`w-full rounded-lg border bg-white p-3 text-left ${
                          selectedItem === index ? 'border-amber-500' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-950">{name}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">{desc}</p>
                          </div>
                          <span className="font-black text-amber-600">{price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-white p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-600">Pedido #1042</span>
                      <span className="font-black text-green-600">Recebido</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Cliente cadastrado automaticamente pelo telefone.
                    </p>
                  </div>
                  <button className="mt-4 w-full rounded-lg bg-amber-500 py-3 text-sm font-black text-white">
                    Confirmar pedido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
