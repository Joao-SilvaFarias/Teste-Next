'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Camera, Home, CreditCard, LogIn, LogOut } from 'lucide-react';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    // Escuta mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (pathname === '/admin/login') return null;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-6 py-3 rounded-full flex items-center gap-8 shadow-2xl z-[100]">
      <NavLink href="/" active={pathname === '/'} icon={<Home size={20} />} label="Home" />
      
      {isAdmin ? (
        <>
          <NavLink href="/recepcao" active={pathname === '/recepcao'} icon={<Camera size={20} />} label="Portaria" />
          <NavLink href="/admin" active={pathname.startsWith('/admin')} icon={<LayoutDashboard size={20} />} label="Gestão" />
          <button onClick={() => supabase.auth.signOut()} className="text-zinc-500 hover:text-red-400 flex flex-col items-center gap-1 transition-all">
            <LogOut size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
          </button>
        </>
      ) : (
        <>
          <NavLink href="/perfil" active={pathname === '/perfil'} icon={<CreditCard size={20} />} label="Conta" />
          {/* LINK PARA O LOGIN ADM */}
          <NavLink href="/admin/login" active={pathname === '/admin/login'} icon={<LogIn size={20} />} label="Admin" />
        </>
      )}
    </nav>
  );
}

// Subcomponente NavLink para manter o código limpo
function NavLink({ href, active, icon, label }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-yellow-400' : 'text-zinc-500 hover:text-zinc-200'}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Link>
  );
}