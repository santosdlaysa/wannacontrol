'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { Perfil } from '@cafecontrol/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Perfil[];
}

const navItems: NavItem[] = [
  {
    label: 'Pedidos',
    href: '/pedidos',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Mesas',
    href: '/mesas',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM],
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
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    label: 'Produtos',
    href: '/produtos',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Caixa',
    href: '/caixa',
    roles: [Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA],
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
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    roles: [Perfil.ADMIN, Perfil.GERENTE],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-cafe-700 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-cafe-700 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.perfil as Perfil)
  );

  const isKitchenFullscreen = pathname === '/cozinha';

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        {!isKitchenFullscreen && (
          <aside className="w-64 bg-cafe-900 text-white flex flex-col fixed h-full z-30">
            {/* Logo */}
            <div className="p-5 border-b border-cafe-800">
              <h1 className="text-xl font-bold text-cafe-50">CafeControl</h1>
              <p className="text-cafe-300 text-xs mt-0.5">Gestao de Cafeteria</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
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
                <div className="flex items-center gap-4">
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
