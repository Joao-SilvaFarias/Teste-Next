'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Camera, Home, CreditCard, LogIn, LogOut, Users, ChevronUp, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [pendente, setPendente] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function checkUser(session: any) {
      if (!session) {
        setIsAdmin(false);
        setIsLogged(false);
        setPendente(false);
        return;
      }
      setIsLogged(true);

      // 1. Buscamos o perfil
      const { data: perfil, error } = await supabase
        .from('alunos')
        .select('role, face_descriptor')
        .eq('email', session.user.email)
        .maybeSingle();

      // 2. Definimos ehAdmin com segurança (se perfil for null, assume false)
      const ehAdmin = !!(perfil?.role === 'admin' || perfil?.role === 'aluno_admin');

      setIsAdmin(ehAdmin);

      // PROTEÇÃO EXTRA: Se o cara estiver em uma rota /admin mas não for admin, 
      // forçamos o estado a fechar e redirecionamos.
      if (pathname.startsWith('/admin') && !ehAdmin && perfil !== null) {
        window.location.href = '/'; // Expulsa para a home
      }

      // 3. Definimos o status pendente (apenas se for aluno comum e não tiver foto)
      // Usamos perfil?. para evitar erro caso o objeto seja nulo
      const temFoto = !!perfil?.face_descriptor;
      setPendente(!ehAdmin && perfil !== null && !temFoto);
    }

    supabase.auth.getSession().then(({ data: { session } }) => checkUser(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => checkUser(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fecha o menu de admin ao mudar de página
  useEffect(() => setShowAdminMenu(false), [pathname]);

  if (pathname === '/admin/login') return null;

  return (
    <>
      {/* --- BANNER DE AVISO --- */}
      {pendente && (
        <div className="fixed top-0 left-0 w-full bg-[#9ECD1D] text-black text-[10px] sm:text-[11px] font-black uppercase py-3 z-[999] flex justify-center items-center gap-3 shadow-lg border-b border-black/10 px-4">
          <span className="flex items-center gap-2 truncate">
            <Camera size={14} className="animate-pulse" />
            Bio Pendente: Cadastre sua biometria para acesso
          </span>
          <Link href="/registrar-rosto" className="bg-black text-white px-3 py-1 rounded-full whitespace-nowrap text-[9px]">
            Resolver
          </Link>
        </div>
      )}

      {/* --- MENU SUSPENSO ADMIN (MOBILE/PROFISSIONAL) --- */}
      {showAdminMenu && isAdmin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl z-[101] flex flex-col gap-1 min-w-[160px] animate-in fade-in zoom-in slide-in-from-bottom-4 duration-200">
          <AdminSubLink href="/recepcao" icon={<Camera size={18} />} label="Portaria" active={pathname === '/recepcao'} />
          <AdminSubLink href="/admin/alunos" icon={<Users size={18} />} label="Alunos" active={pathname === '/admin/alunos'} />
          <AdminSubLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/admin'} />
        </div>
      )}

      {/* --- NAVBAR PRINCIPAL --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-3xl flex items-center gap-5 sm:gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] transition-all duration-300">

        <NavLink href="/" active={pathname === '/'} icon={<Home size={20} />} label="Início" />

        {isLogged ? (
          <>
            {isAdmin ? (
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className={`flex flex-col items-center gap-1 transition-all ${showAdminMenu || pathname.startsWith('/admin') || pathname === '/recepcao' ? 'text-[#9ECD1D]' : 'text-zinc-500'}`}
              >
                <div className="relative">
                  <ShieldCheck size={20} />
                  <ChevronUp size={12} className={`absolute -right-3 top-1 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">Admin</span>
              </button>
            ) : null}

            <NavLink href="/perfil" active={pathname === '/perfil'} icon={<CreditCard size={20} />} label="Conta" />

            <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

            <button onClick={() => supabase.auth.signOut()} className="text-zinc-500 hover:text-red-400 flex flex-col items-center gap-1 transition-all">
              <LogOut size={20} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Sair</span>
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

// Componente de Link Principal
function NavLink({ href, active, icon, label }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#9ECD1D]' : 'text-zinc-500 hover:text-zinc-100'}`}>
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest hidden xs:block">{label}</span>
    </Link>
  );
}

// Componente de Link do Menu Admin Suspenso
function AdminSubLink({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-[#9ECD1D]/10 text-[#9ECD1D]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
    >
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </Link>
  );
}