'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageLoading from '@/components/ui/PageLoading';

interface CadastroResponse {
  accessToken: string;
  usuario: {
    userId: number;
    restauranteId: number;
    perfil: string;
    nome: string;
    email: string;
  };
  restaurante: {
    id: number;
    nome: string;
    slug: string;
    plano: string;
  };
}

export default function CadastroPage() {
  const [nomeRestaurante, setNomeRestaurante] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plano = searchParams.get('plano') || 'PROFISSIONAL';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nomeRestaurante.trim() || !nomeResponsavel.trim() || !email.trim() || !senha) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }
    if (senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.post<CadastroResponse>('/public/cadastro', {
        nomeRestaurante: nomeRestaurante.trim(),
        nomeResponsavel: nomeResponsavel.trim(),
        email: email.trim(),
        senha,
        telefone: telefone.trim() || null,
      });

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        userId: data.usuario.userId,
        restauranteId: data.usuario.restauranteId,
        perfil: data.usuario.perfil,
        nome: data.usuario.nome,
        email: data.usuario.email,
      }));
      localStorage.setItem('restaurante', JSON.stringify(data.restaurante));

      toast.success(`Bem-vindo ao ChefFlow, ${data.usuario.nome}!`);
      router.push(`/assinatura?plano=${plano}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cafe-900 via-cafe-800 to-cafe-700 px-4 py-10">
      {isLoading && <PageLoading message="Criando conta..." />}

      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cafe-700 rounded-full mb-4">
                <svg className="w-8 h-8 text-cafe-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-cafe-900">Criar conta</h1>
            <p className="text-cafe-500 mt-1">Comece a usar o ChefFlow hoje mesmo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do restaurante *"
              type="text"
              placeholder="Ex: Pizzaria do Joao"
              value={nomeRestaurante}
              onChange={(e) => setNomeRestaurante(e.target.value)}
            />
            <Input
              label="Seu nome (responsavel) *"
              type="text"
              placeholder="Ex: Joao Silva"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
            />
            <Input
              label="E-mail *"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Senha *"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Input
              label="Telefone (opcional)"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full mt-2"
            >
              Criar conta e escolher plano
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ja tem conta?{' '}
            <Link href="/login" className="text-cafe-700 font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-cafe-200 text-sm mt-6">
          ChefFlow &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
