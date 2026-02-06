'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Camera,
  Home,
  CreditCard,
  LogIn,
  LogOut,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';

export default function Navbar() {
  const { user, perfil, isAdmin, loading, signOut } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const pathname = usePathname();
  const [contagemPresentes, setContagemPresentes] = useState<number | null>(null);

  const buscarLotação = async () => {
    try {
      const { count, error } = await supabase
        .from('alunos_presentes')
        .select('*', { count: 'exact', head: true });
      if (!error) setContagemPresentes(count);
    } catch (err) {
      console.error("Erro ao buscar lotação:", err);
    }
  };

  useEffect(() => {
    buscarLotação();
    const canalLotação = supabase
      .channel('lotação-realtime')
      .on('postgres_changes', { event: '*', table: 'checkins', schema: 'public' }, () => {
        buscarLotação();
      })
      .subscribe();
    return () => { supabase.removeChannel(canalLotação); };
  }, []);

  const getStatusLotação = () => {
    if (contagemPresentes === null) return { cor: 'bg-zinc-500', texto: '...' };
    if (contagemPresentes <= 15) return { cor: 'bg-emerald-500', texto: 'Tranquila' };
    if (contagemPresentes <= 35) return { cor: 'bg-yellow-500', texto: 'Moderada' };
    return { cor: 'bg-red-500', texto: 'Lotada' };
  };

  const status = getStatusLotação();

  useEffect(() => setShowAdminMenu(false), [pathname]);

  if (pathname === '/admin/login') return null;
  if (loading) return <NavbarSkeleton />;

  const perfilPronto = perfil !== null && perfil !== undefined;
  const temFoto = !!perfil?.face_descriptor;
  const temNotificacao = user && !isAdmin && perfilPronto && !temFoto;

  return (
    <>
      {/* --- BANNER DE AVISO (BIOMETRIA) --- */}
      {temNotificacao && (
        <div className="fixed top-0 left-0 w-full bg-[#9ECD1D] text-black text-[10px] sm:text-[11px] font-black uppercase py-4 z-[999] flex justify-center items-center gap-3 shadow-lg border-b border-black/10 px-6 animate-in slide-in-from-top duration-500">
          <span className="flex items-center gap-2 truncate">
            <Camera size={14} className="animate-bounce" />
            Bio Pendente: Cadastre sua biometria
          </span>
          <Link href="/registrar-rosto" className="bg-black text-white px-3 py-1 rounded-full whitespace-nowrap text-[9px] hover:scale-105 transition-transform">
            Resolver Agora
          </Link>
        </div>
      )}

      {/* --- MENU SUSPENSO ADMIN --- */}
      {showAdminMenu && isAdmin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl z-[101] flex flex-col gap-1 min-w-[180px] animate-in fade-in zoom-in slide-in-from-bottom-4 duration-200">
          <div className="px-3 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800 mb-1">Gestão Interna</div>
          <AdminSubLink href="/admin/recepcao" icon={<Camera size={18} />} label="Portaria" active={pathname === '/admin/recepcao'} />
          <AdminSubLink href="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Painel Geral" active={pathname === '/admin/dashboard'} />
        </div>
      )}

      {/* --- NAVBAR PRINCIPAL --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-[2.5rem] flex items-center gap-6 sm:gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] w-auto animate-in fade-in zoom-in duration-500">
        
        {/* Lotação */}
        <div className="flex flex-col items-center gap-0.5 border-r border-white/10 pr-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.cor}`} />
            <span className="text-[10px] font-black text-white leading-none">{contagemPresentes ?? 0}</span>
          </div>
          <span className="text-[7px] text-zinc-500 uppercase font-bold hidden xs:block">{status.texto}</span>
        </div>

        {/* Home */}
        <NavLink href="/" active={pathname === '/'} icon={<Home size={20} />} label="Início" />

        {user ? (
          <>
            {isAdmin && (
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${showAdminMenu || pathname.startsWith('/admin') ? 'text-[#9ECD1D]' : 'text-zinc-500 hover:text-white'}`}
              >
                <div className="relative">
                  <ShieldCheck size={20} />
                  <ChevronUp size={12} className={`absolute -right-3 top-1 transition-transform duration-300 ${showAdminMenu ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[9px] font-black uppercase hidden xs:block">Admin</span>
              </button>
            )}

            <NavLink 
              href="/perfil" 
              active={pathname === '/perfil'} 
              icon={<CreditCard size={20} />} 
              label="Conta" 
              hasBadge={temNotificacao} 
            />

            <button onClick={signOut} className="text-zinc-500 hover:text-red-500 flex flex-col items-center gap-1 transition-all group">
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[9px] font-black uppercase hidden xs:block">Sair</span>
            </button>
          </>
        ) : (
          <>
            <NavLink href="/perfil" active={pathname === '/perfil'} icon={<CreditCard size={20} />} label="Login" />
            <NavLink href="/admin/login" active={pathname === '/admin/login'} icon={<LogIn size={20} />} label="Admin" />
          </>
        )}
      </nav>
    </>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---

function NavLink({ href, active, icon, label, hasBadge }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#9ECD1D]' : 'text-zinc-500 hover:text-zinc-100'}`}>
      <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
        {hasBadge && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-zinc-950 rounded-full animate-bounce" />
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest hidden xs:block">{label}</span>
    </Link>
  );
}

function AdminSubLink({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-[#9ECD1D]/10 text-[#9ECD1D]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'animate-pulse' : ''}`}>{icon}</span>
      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </Link>
  );
}

function NavbarSkeleton() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/50 backdrop-blur-xl border border-white/5 px-8 py-4 rounded-[2.5rem] flex items-center gap-8 shadow-xl z-[100] w-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-5 h-5 bg-zinc-800 rounded-lg" />
          <div className="w-7 h-1.5 bg-zinc-900 rounded-full" />
        </div>
      ))}
    </nav>
  );
}