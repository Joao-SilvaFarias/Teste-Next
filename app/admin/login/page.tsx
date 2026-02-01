'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext'; // Importando o contexto

export default function AdminLogin() {
  const { isAdmin, loading: authLoading } = useAuth(); // Consumindo o estado global
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingInterno, setLoadingInterno] = useState(false);
  const router = useRouter();

  // Redirecionamento Automático: Se já for Admin, pula o login
  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, authLoading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingInterno(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao entrar: ' + error.message);
      setLoadingInterno(false);
    } 
    // Não precisamos de router.push aqui obrigatoriamente, 
    // pois o useEffect acima detectará a mudança de isAdmin e redirecionará.
  }

  // Enquanto verifica se o user já está logado
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#9ECD1D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
            ADMIN<span className="text-[#9ECD1D]">LOGIN</span>
          </h1>
        </div>

        <form 
          onSubmit={handleLogin} 
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl space-y-5"
        >
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-2 block">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-[#9ECD1D] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-2 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-[#9ECD1D] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingInterno}
            className="w-full cursor-pointer bg-[#9ECD1D] text-black font-black py-4 rounded-xl hover:bg-[#b4e637] transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50 mt-4 shadow-lg shadow-[#9ECD1D]/10"
          >
            {loadingInterno ? <Loader2 className="animate-spin w-5 h-5" /> : 'Acessar Painel'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <button onClick={() => router.push('/')} className="text-zinc-600 text-[10px] font-bold uppercase hover:text-zinc-400 transition-colors">
            Voltar para o site
          </button>
        </div>
      </div>
    </div>
  );
}