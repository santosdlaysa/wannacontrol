'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import PageLoading from '@/components/ui/PageLoading';
import { NotificacoesPedidos } from '@/components/ui/NotificacoesPedidos';
import { PopupNovoPedido } from '@/components/ui/PopupNovoPedido';
import { Perfil } from '@chefflow/shared';
import { api } from '@/lib/api-client';

type PlanoSistema = 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';

const PLANO_ORDER: PlanoSistema[] = ['BASICO', 'PROFISSIONAL', 'ENTERPRISE'];

function planoAtingePlano(planoAtual: string | undefined, planoMinimo: PlanoSistema): boolean {
  const idx = PLANO_ORDER.indexOf((planoAtual || 'BASICO') as PlanoSistema);
  return idx >= PLANO_ORDER.indexOf(planoMinimo);
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Perfil[];
  planoMinimo: PlanoSistema;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Pedidos',
    href: '/pedidos',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Delivery',
    href: '/delivery',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    label: 'Mesas',
    href: '/mesas',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    planoMinimo: 'PROFISSIONAL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: 'Cozinha',
    href: '/cozinha',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.COZINHA],
    planoMinimo: 'PROFISSIONAL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    label: 'Caixa',
    href: '/caixa',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA],
    planoMinimo: 'PROFISSIONAL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA],
    planoMinimo: 'PROFISSIONAL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Produtos',
    href: '/produtos',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Categorias',
    href: '/categorias',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    href: '/clientes',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'PROFISSIONAL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Entregadores',
    href: '/entregadores',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'ENTERPRISE',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
  },
  {
    label: 'Complementos',
    href: '/complementos',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'ENTERPRISE',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    label: 'Configuracoes',
    href: '/configuracoes',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Assinatura',
    href: '/assinatura',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    planoMinimo: 'BASICO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m4-6h-6m6 0v6m0-6l-8 8" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, restaurante, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const verificouAssinatura = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && pathname !== '/assinatura') {
      // Verificacao rapida pelo cache local
      if (!restaurante || !restaurante.ativo) {
        router.push('/assinatura');
        return;
      }

      // Verificacao no backend uma vez por sessao
      if (!verificouAssinatura.current) {
        verificouAssinatura.current = true;
        api.get<{ ativo: boolean; plano: string }>('/restaurante/me')
          .then((data) => {
            if (!data.ativo) {
              const stored = localStorage.getItem('restaurante');
              if (stored) {
                try {
                  localStorage.setItem('restaurante', JSON.stringify({ ...JSON.parse(stored), ativo: false }));
                } catch {}
              }
              router.push('/assinatura');
            }
          })
          .catch(() => {});
      }
    }
  }, [isLoading, isAuthenticated, restaurante, pathname, router]);

  if (isLoading) {
    return <PageLoading message="Carregando sistema..." />;
  }

  if (!user) return null;

  const planoAtual = restaurante?.plano as string | undefined;
  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.perfil as Perfil)
  );

  const isKitchenFullscreen = pathname === '/cozinha';

  return (
    <SocketProvider>
      <PopupNovoPedido />
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        {!isKitchenFullscreen && (
          <aside className="w-64 bg-cafe-900 text-white flex flex-col fixed h-full z-30">
            {/* Logo */}
            <div className="p-5 border-b border-cafe-800">
              <h1 className="text-xl font-bold text-cafe-50 truncate">
                {restaurante?.nome || 'ChefFlow'}
              </h1>
              <p className="text-cafe-300 text-xs mt-0.5">Restaurante</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
              {filteredNav.map((item) => {
                const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
                const bloqueado = !planoAtingePlano(planoAtual, item.planoMinimo);
                if (bloqueado) {
                  return (
                    <Link
                      key={item.href}
                      href="/assinatura"
                      title={`Disponivel no plano ${item.planoMinimo === 'PROFISSIONAL' ? 'Profissional' : 'Premium'}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cafe-600 hover:bg-cafe-800/50 hover:text-cafe-400 transition-colors duration-150"
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-cafe-700 text-cafe-50'
                          : 'text-cafe-200 hover:bg-cafe-800 hover:text-white'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-cafe-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cafe-700 flex items-center justify-center text-sm font-bold text-cafe-50">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.nome}
                  </p>
                  <p className="text-xs text-cafe-300">{user.perfil}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-cafe-800 text-cafe-300 hover:text-white transition-colors"
                  title="Sair"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main
          className={`flex-1 ${!isKitchenFullscreen ? 'ml-64' : ''}`}
        >
          {/* Top bar for kitchen fullscreen mode */}
          {isKitchenFullscreen && (
            <div className="bg-cafe-900 text-white px-4 py-2 flex items-center justify-between">
              <Link href="/pedidos" className="text-cafe-200 hover:text-white text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Link>
              <h1 className="text-lg font-bold">Cozinha - KDS</h1>
              <div className="flex items-center gap-3">
                <span className="text-cafe-200 text-sm">{user.nome}</span>
                <button
                  onClick={logout}
                  className="text-cafe-300 hover:text-white text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          )}

          {!isKitchenFullscreen && (
            <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-3">
                  <NotificacoesPedidos />
                  <span className="text-sm text-gray-500">
                    Olá, <span className="font-medium text-gray-700">{user.nome}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-cafe-600 hover:text-cafe-800 font-medium"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </header>
          )}

          <div className={isKitchenFullscreen ? '' : 'p-6'}>
            {children}
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}
