'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Home,
  CreditCard,
  LogOut,
  ShieldCheck,
  ScanFace,
  Activity,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';

export default function Navbar() {
  const { user, perfil, isAdmin, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [contagemPresentes, setContagemPresentes] = useState<number | null>(null);

  const buscarFluxo = async () => {
    try {
      const { count, error } = await supabase
        .from('alunos_presentes')
        .select('*', { count: 'exact', head: true });
      if (!error) setContagemPresentes(count);
    } catch (err) {
      console.error("Erro na leitura de fluxo:", err);
    }
  };

  useEffect(() => {
    buscarFluxo();
    const canalFluxo = supabase
      .channel('fluxo-realtime')
      .on('postgres_changes', { event: '*', table: 'checkins', schema: 'public' }, () => {
        buscarFluxo();
      })
      .subscribe();
    return () => { supabase.removeChannel(canalFluxo); };
  }, []);

  const getStatusFluxo = () => {
    if (contagemPresentes === null) return { cor: 'bg-zinc-800', texto: 'SISTEMA_OFF' };
    if (contagemPresentes <= 15) return { cor: 'bg-[#9ECD1D]', texto: 'FLUXO_BAIXO' };
    if (contagemPresentes <= 35) return { cor: 'bg-orange-500', texto: 'FLUXO_MÉDIO' };
    return { cor: 'bg-red-600', texto: 'CAPACIDADE_MÁX' };
  };

  const status = getStatusFluxo();

  if (pathname === '/admin/login') return null;
  if (loading) return <NavbarSkeleton />;

  const perfilPronto = perfil !== null && perfil !== undefined;
  const temFoto = !!perfil?.face_descriptor;
  const alertaBiometria = user && !isAdmin && perfilPronto && !temFoto;

  return (
    <>
      {/* --- BANNER DE ALERTA DE SEGURANÇA --- */}
      {alertaBiometria && (
        <div className="fixed top-0 left-0 w-full bg-[#9ECD1D] text-black text-[10px] font-black uppercase py-4 z-[999] flex justify-center items-center gap-4 shadow-[0_10px_30px_rgba(158,205,29,0.2)] border-b border-black/20 px-6 animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-2 tracking-tighter">
            <Activity size={14} className="animate-pulse" />
            PENDÊNCIA IDENTIFICADA: BIOMETRIA FACIAL NÃO LOCALIZADA
          </div>
          <Link href="/registrar-rosto" className="bg-black text-[#9ECD1D] px-4 py-1.5 rounded-lg text-[9px] hover:scale-105 transition-all italic border border-black active:scale-95">
            ATUALIZAR_ID
          </Link>
        </div>
      )}

      {/* --- NAVBAR BXVS MAIN (LINHA ÚNICA) --- */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#050505]/80 backdrop-blur-3xl border border-white/10 px-6 py-4 rounded-[2rem] flex items-center gap-6 sm:gap-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-[100] w-[95%] max-w-fit animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Monitor de Fluxo Real-time */}
        <div className="hidden xs:flex flex-col items-start gap-0.5 border-r border-white/5 pr-6 group cursor-default">
           <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status.cor} shadow-[0_0_10px_currentcolor] animate-pulse`} />
            <span className="text-xs font-black italic text-white tracking-tighter">{contagemPresentes ?? 0}</span>
          </div>
          <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest leading-none">{status.texto}</span>
        </div>

        {/* Links de Navegação */}
        <NavLink href="/" active={pathname === '/'} icon={<Home size={20} />} label="Início" />

        {user ? (
          <>
            {/* Seção Administrativa Direta */}
            {isAdmin && (
              <>
                <NavLink 
                  href="/admin/recepcao" 
                  active={pathname === '/admin/recepcao'} 
                  icon={<ScanFace size={20} />} 
                  label="Portaria" 
                />
                <NavLink 
                  href="/admin" 
                  active={pathname === '/admin' && !pathname.includes('recepcao')} 
                  icon={<LayoutDashboard size={20} />} 
                  label="Painel" 
                />
              </>
            )}

            {/* Link de Perfil/Conta */}
            <NavLink
              href="/perfil"
              active={pathname === '/perfil'}
              icon={<CreditCard size={20} />}
              label="ID_Atleta"
              hasBadge={alertaBiometria}
            />

            {/* Comando de Saída */}
            <button onClick={signOut} className="text-zinc-700 hover:text-red-500 flex flex-col items-center gap-1 transition-all group border-l border-white/5 pl-4 sm:pl-8">
              <LogOut size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-tighter hidden sm:block">Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink href="/perfil" active={pathname === '/perfil'} icon={<CreditCard size={20} />} label="Entrar" />
            <NavLink href="/admin/login" active={pathname === '/admin/login'} icon={<ShieldCheck size={20} />} label="Acesso_Staff" />
          </>
        )}
      </nav>
    </>
  );
}

// --- SUB-COMPONENTES REFINADOS ---

function NavLink({ href, active, icon, label, hasBadge }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#9ECD1D]' : 'text-zinc-600 hover:text-white'}`}>
      <div className={`relative ${active ? 'scale-110' : ''} transition-all duration-300`}>
        {icon}
        {hasBadge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-[3px] border-[#050505] rounded-full animate-bounce shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
        )}
      </div>
      <span className="text-[8px] font-black uppercase italic tracking-[0.1em] hidden xs:block">{label}</span>
      {active && <div className="w-1 h-1 bg-[#9ECD1D] rounded-full shadow-[0_0_8px_#9ECD1D]" />}
    </Link>
  );
}

function NavbarSkeleton() {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#050505]/50 backdrop-blur-xl border border-white/5 px-10 py-5 rounded-[2rem] flex items-center gap-10 shadow-xl z-[100] w-auto animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-6 h-6 bg-zinc-900 rounded-lg" />
      ))}
    </nav>
  );
}