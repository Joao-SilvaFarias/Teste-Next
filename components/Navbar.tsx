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
  Users, 
  ChevronUp, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function Navbar() {
  const { user, perfil, isAdmin, loading, signOut } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const pathname = usePathname();

  // Fecha o menu de admin ao mudar de página
  useEffect(() => setShowAdminMenu(false), [pathname]);

  // Se estiver carregando a sessão ou for a tela de login admin, não mostra nada
  if (loading || pathname === '/admin/login') return null;

  /**
   * REGRA DE OURO: O banner só deve ser calculado se o perfil já foi carregado.
   * Se o perfil for nulo enquanto o carregamento principal já terminou, 
   * significa que os dados ainda estão sendo buscados no banco de dados.
   */
  const perfilPronto = perfil !== null && perfil !== undefined;
  const temFoto = !!perfil?.face_descriptor;
  
  // Condição para mostrar o alerta de biometria pendente
  const mostrarAlertaBio = user && !isAdmin && perfilPronto && !temFoto;

  return (
    <>
      {/* --- BANNER DE AVISO (BIOMETRIA) --- */}
      {mostrarAlertaBio && (
        <div className="fixed top-0 left-0 w-full bg-[#9ECD1D] text-black text-[10px] sm:text-[11px] font-black uppercase py-3 z-[999] flex justify-center items-center gap-3 shadow-lg border-b border-black/10 px-4 animate-in slide-in-from-top duration-500">
          <span className="flex items-center gap-2 truncate">
            <Camera size={14} className="animate-bounce" />
            Bio Pendente: Cadastre sua biometria para acesso
          </span>
          <Link 
            href="/registrar-rosto" 
            className="bg-black text-white px-3 py-1 rounded-full whitespace-nowrap text-[9px] hover:scale-105 transition-transform"
          >
            Resolver Agora
          </Link>
        </div>
      )}

      {/* --- MENU SUSPENSO ADMIN --- */}
      {showAdminMenu && isAdmin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl z-[101] flex flex-col gap-1 min-w-[180px] animate-in fade-in zoom-in slide-in-from-bottom-4 duration-200">
          <div className="px-3 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800 mb-1">
            Gestão Interna
          </div>
          <AdminSubLink href="/admin/recepcao" icon={<Camera size={18} />} label="Portaria / Check-in" active={pathname === '/admin/recepcao'} />
          <AdminSubLink href="/admin/alunos" icon={<Users size={18} />} label="Lista de Alunos" active={pathname === '/admin/alunos'} />
          <AdminSubLink href="/admin" icon={<LayoutDashboard size={18} />} label="Painel Geral" active={pathname === '/admin'} />
        </div>
      )}

      {/* --- NAVBAR PRINCIPAL (BOTTOM BAR) --- */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-3xl flex items-center gap-5 sm:gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] transition-all duration-300`}>

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
                  <ChevronUp size={12} className={`absolute -right-3 top-1 transition-transform duration-300 ${showAdminMenu ? 'rotate-180 text-[#9ECD1D]' : ''}`} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
              </button>
            )}

            <NavLink href="/perfil" active={pathname === '/perfil'} icon={<CreditCard size={20} />} label="Conta" />

            <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

            <button 
              onClick={signOut} 
              className="text-zinc-500 hover:text-red-500 flex flex-col items-center gap-1 transition-all cursor-pointer group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Sair</span>
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

/** * COMPONENTES AUXILIARES
 */

function NavLink({ href, active, icon, label }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#9ECD1D]' : 'text-zinc-500 hover:text-zinc-100'}`}>
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest hidden xs:block">{label}</span>
    </Link>
  );
}

function AdminSubLink({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-[#9ECD1D]/10 text-[#9ECD1D]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className={`${active ? 'animate-pulse' : ''}`}>{icon}</span>
      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </Link>
  );
}