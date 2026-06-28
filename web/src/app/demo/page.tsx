'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function autoLogin() {
      try {
        const res = await fetch('/api/v1/auth/demo-token');
        if (!res.ok) throw new Error('Demo indisponivel');
        const data = await res.json();

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
        if (data.restaurante) localStorage.setItem('restaurante', JSON.stringify(data.restaurante));

        router.replace('/dashboard');
      } catch {
        setError('Demo temporariamente indisponivel. Tente novamente em instantes.');
      }
    }

    autoLogin();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-cafe-800 text-white rounded-lg text-sm font-semibold hover:bg-cafe-900"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Acessando demo...</p>
      </div>
    </div>
  );
}
