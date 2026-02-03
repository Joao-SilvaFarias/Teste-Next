'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react'; // Biblioteca padrão para React
import { ChevronLeft, ShieldCheck, Zap, Info } from 'lucide-react';
import Link from 'next/link';

export default function CheckinPage() {
  const { user, perfil, loading } = useAuth();
  const router = useRouter();

  if (loading) return null; // Deixe o loading.tsx (Skeleton) agir

  // Se não estiver logado, manda pro login
  if (!user) {
    router.replace('/perfil');
    return null;
  }

  // Valor que será lido pela câmera da portaria
  const qrValue = JSON.stringify({
    id: user.id,
    email: user.email,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      
      {/* Header com Voltar */}
      <header className="w-full max-w-md flex items-center justify-between mb-12">
        <Link href="/" className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] italic">Acesso <span className="text-[#9ECD1D]">Digital</span></h1>
        <div className="w-12 h-12" /> {/* Placeholder para equilibrar o flex */}
      </header>

      {/* Cartão de Acesso */}
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Detalhe Decorativo de Fundo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#9ECD1D]/10 blur-[50px] rounded-full" />

        <div className="flex flex-col items-center text-center">
          {/* Avatar / Status */}
          <div className="w-16 h-16 bg-[#9ECD1D]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#9ECD1D]/20 text-[#9ECD1D]">
            <ShieldCheck size={32} />
          </div>
          
          <h2 className="text-xl font-black uppercase italic leading-none">{perfil?.nome || 'Aluno'}</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 mb-8">Plano Smart Ativo</p>

          {/* QR CODE CONTAINER */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-8">
            <QRCodeSVG 
              value={qrValue}
              size={180}
              level="H" // Alta tolerância a erros
              includeMargin={false}
              fgColor="#000000"
            />
          </div>

          <div className="flex items-center gap-2 text-[#9ECD1D] bg-[#9ECD1D]/5 px-4 py-2 rounded-full mb-4">
            <Zap size={14} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Aproxime do leitor</span>
          </div>

          <p className="text-[9px] text-zinc-600 font-medium uppercase leading-relaxed max-w-[200px]">
            Este código é atualizado em tempo real para sua segurança.
          </p>
        </div>
      </div>

      {/* Dica de Uso */}
      <div className="mt-8 flex items-start gap-4 max-w-xs bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
        <Info size={20} className="text-zinc-500 shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-tight">
          Aumente o brilho do seu celular caso o leitor tenha dificuldade em identificar o código.
        </p>
      </div>

    </div>
  );
}