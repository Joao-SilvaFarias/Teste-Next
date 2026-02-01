'use client';

import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Lock, Mail, CreditCard, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function PerfilAluno() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Substitua o estado único por esses dois
const [loadingLogin, setLoadingLogin] = useState(false);
const [loadingPortal, setLoadingPortal] = useState(false);

// Na função handleLogin, use setLoadingLogin
// Na função gerenciarAssinatura, use setLoadingPortal

  // Função disparada pelo Form (Apenas Login)
  // Função disparada pelo Form (Apenas Login)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingLogin(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert("Erro ao entrar: " + error.message);
        // Só resetamos aqui se houver erro para o usuário tentar de novo
        setLoadingLogin(false);
      }
      // Se não houver erro, o AuthContext atualizará o 'user' 
      // e o React trocará a renderização para o painel logado.
    } catch (err) {
      setLoadingLogin(false);
    }
  }

  async function gerenciarAssinatura() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error);
    } catch (err) {
      alert("Erro ao conectar ao portal de pagamentos.");
    }
    setLoadingPortal(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#9ECD1D] animate-spin" />
      </div>
    );
  }

  // --- VISÃO LOGADO ---
  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#9ECD1D]/10 text-[#9ECD1D] rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase mb-2">Área do Aluno</h1>
          <p className="text-zinc-500 mb-8 text-sm">
            Logado como: <span className="text-zinc-300 font-bold">{user.email}</span>
          </p>

          <button
            onClick={gerenciarAssinatura}
            disabled={loadingPortal}
            className="w-full bg-[#9ECD1D] text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#9ECD1D]/10"
          >
            {loadingPortal ? <Loader2 className="animate-spin w-5 h-5" /> : 'Gerenciar Pagamentos'}
          </button>

          <button
            onClick={signOut}
            className="mt-8 cursor-pointer text-zinc-600 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // --- VISÃO DESLOGADO (APENAS LOGIN) ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            SMART<span className="text-[#9ECD1D]">FIT</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
            Acesse sua área exclusiva
          </p>
        </header>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-zinc-600" size={18} />
            <input
              required
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all placeholder:text-zinc-700 text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-zinc-600" size={18} />
            <input
              required
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all placeholder:text-zinc-700 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full bg-[#9ECD1D] flex justify-center items-center cursor-pointer text-black font-black py-5 rounded-2xl mt-4 hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#9ECD1D]/10"
          >
            {loadingLogin ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.1em] max-w-[200px] mx-auto">
          Acesso restrito para alunos matriculados
        </p>
      </div>
    </div>
  );
}