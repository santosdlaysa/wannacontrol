'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { Perfil } from '@cafecontrol/shared';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface DashboardData {
  pedidosHoje: number;
  pedidosPagosHoje: number;
  pedidosAbertos: number;
  emPreparo: number;
  prontos: number;
  faturamento: number;
  totalMes: number;
}

function StatCard({
  label,
  value,
  sub,
  color = 'gray',
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'cafe';
  href?: string;
}) {
  const colorMap = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    cafe: 'bg-cafe-50 border-cafe-200 text-cafe-700',
  };

  const content = (
    <div className={`rounded-xl border p-5 ${colorMap[color]} ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>('/financeiro/dashboard');
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const canSeeFinanceiro = user && [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA].includes(user.perfil as Perfil);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visao geral do dia</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-500">Nao foi possivel carregar os dados</div>
      ) : (
        <>
          {/* Operacoes */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Operacoes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Pedidos Hoje" value={data.pedidosHoje} color="cafe" />
              <StatCard label="Pagos Hoje" value={data.pedidosPagosHoje} color="green" />
              <StatCard label="Abertos" value={data.pedidosAbertos} color="blue" href="/pedidos" />
              <StatCard label="Em Preparo" value={data.emPreparo} color="orange" href="/cozinha" />
              <StatCard label="Prontos" value={data.prontos} color="red" href="/cozinha" />
            </div>
          </section>

          {/* Financeiro */}
          {canSeeFinanceiro && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Financeiro</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  label="Faturamento Hoje"
                  value={formatBRL(data.faturamento)}
                  sub="Pedidos pagos no dia"
                  color="green"
                  href="/financeiro"
                />
                <StatCard
                  label="Faturamento do Mes"
                  value={formatBRL(data.totalMes)}
                  sub="Acumulado no mes atual"
                  color="cafe"
                  href="/financeiro"
                />
              </div>
            </section>
          )}

          {/* Atalhos */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Acesso Rapido</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Mesas', href: '/mesas', desc: 'Gerenciar mesas' },
                { label: 'Pedidos', href: '/pedidos', desc: 'Lista de pedidos' },
                { label: 'Delivery', href: '/delivery', desc: 'Pedidos delivery' },
                { label: 'Cozinha', href: '/cozinha', desc: 'KDS' },
                { label: 'Clientes', href: '/clientes', desc: 'Cadastro de clientes' },
                { label: 'Caixa', href: '/caixa', desc: 'Fluxo de caixa' },
                { label: 'Financeiro', href: '/financeiro', desc: 'Relatorios' },
                { label: 'Produtos', href: '/produtos', desc: 'Cardapio' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-cafe-400 hover:shadow-sm transition-all group"
                >
                  <p className="font-semibold text-gray-800 group-hover:text-cafe-700">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
