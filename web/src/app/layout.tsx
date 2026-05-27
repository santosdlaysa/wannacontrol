import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/providers/AuthProvider';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CafeControl - Sistema de Gestao',
  description: 'Sistema de gestao para cafeterias',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#3E2723',
                color: '#FFF8DC',
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#FFF8DC',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#FFF8DC',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
