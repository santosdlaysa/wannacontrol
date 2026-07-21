'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

interface CardapioQrCodeProps {
  slug: string;
  nomeRestaurante: string;
}

export default function CardapioQrCode({ slug, nomeRestaurante }: CardapioQrCodeProps) {
  const [copiado, setCopiado] = useState(false);
  const qrDownloadRef = useRef<HTMLDivElement>(null);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/cardapio/${slug}`
    : `/cardapio/${slug}`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  function getQrDataUrl(): string | null {
    const canvas = qrDownloadRef.current?.querySelector('canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  }

  function baixarPng() {
    const dataUrl = getQrDataUrl();
    if (!dataUrl) {
      toast.error('Erro ao gerar imagem');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qrcode-cardapio-${slug}.png`;
    link.click();
  }

  function imprimir() {
    const dataUrl = getQrDataUrl();
    if (!dataUrl) {
      toast.error('Erro ao gerar imagem');
      return;
    }
    const janela = window.open('', '_blank', 'width=600,height=800');
    if (!janela) {
      toast.error('Permita pop-ups para imprimir');
      return;
    }
    janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>QR Code - ${nomeRestaurante}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { border: 3px solid #1f2937; border-radius: 24px; padding: 40px 48px; text-align: center; max-width: 420px; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  .sub { color: #6b7280; font-size: 15px; margin-bottom: 24px; }
  img { width: 280px; height: 280px; }
  .cta { font-size: 20px; font-weight: bold; margin-top: 20px; }
  .url { color: #6b7280; font-size: 13px; margin-top: 10px; word-break: break-all; }
  @media print { body { min-height: auto; } }
</style>
</head>
<body>
  <div class="card">
    <h1>${nomeRestaurante}</h1>
    <p class="sub">Cardápio digital</p>
    <img src="${dataUrl}" alt="QR Code do cardápio" />
    <p class="cta">📱 Aponte a câmera e faça seu pedido</p>
    <p class="url">${url}</p>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
    janela.document.close();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Cardápio Digital &amp; QR Code</h2>
      <p className="text-xs text-gray-400 mb-4">
        Imprima o QR Code e cole nas mesas ou no balcão. O cliente aponta a câmera, vê o cardápio e faz o pedido sozinho.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Preview do QR */}
        <div className="rounded-xl border-2 border-gray-200 p-4 bg-white shrink-0">
          <QRCodeCanvas value={url} size={160} level="M" includeMargin={false} />
        </div>

        <div className="flex-1 min-w-0 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Link do cardápio</label>
          <div className="flex gap-2 mb-4">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none"
            />
            <button
              onClick={copiarLink}
              className="shrink-0 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={baixarPng}
              className="px-4 py-2 bg-cafe-700 text-white rounded-lg text-sm font-medium hover:bg-cafe-800 transition-colors"
            >
              Baixar PNG
            </button>
            <button
              onClick={imprimir}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Imprimir cartaz
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Abrir cardápio
            </a>
          </div>
        </div>
      </div>

      {/* QR em alta resolução, só para download/impressão */}
      <div ref={qrDownloadRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas value={url} size={1024} level="M" includeMargin />
      </div>
    </div>
  );
}
