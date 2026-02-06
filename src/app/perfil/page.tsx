'use client';

import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import {
  Lock, Mail, CreditCard, LogOut, Loader2,
  Dumbbell, MapPin, CheckCircle2, AlertCircle, ChevronRight,
  ShieldCheck, Activity
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import LoginSkeleton from '@/src/components/LoginSkeleton';
import { useRouter } from 'next/navigation';

export default function PerfilAluno() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estilos de UI Reutilizáveis
  const styles = {
    card: "bg-zinc-900 border border-zinc-800 rounded-[2.5rem]",
    input: "w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all placeholder:text-zinc-800 text-[10px] font-smart-detail",
    buttonPrimary: "w-full bg-[#9ECD1D] flex justify-center items-center cursor-pointer text-black font-smart-detail py-5 rounded-2xl mt-6 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 uppercase text-[10px] shadow-2xl shadow-[#9ECD1D]/10"
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingLogin(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg("Credenciais inválidas ou erro de conexão.");
        setLoadingLogin(false);
        return;
      }
      setLoadingLogin(false);
    } catch (err) {
      setErrorMsg("Ocorreu um erro inesperado.");
      setLoadingLogin(false);
    }
  }

  async function handleLogout() {
    setLoadingLogin(false);
    setLoadingPortal(false);
    await signOut();
    setEmail('');
    setPassword('');
    router.replace('/perfil');
  }

  async function gerenciarAssinatura() {
    if (isAdmin) {
      router.push('/admin');
      return;
    }
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

  if (authLoading) return <LoginSkeleton />;

  // --- DASHBOARD (LOGADO) ---
  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 pb-20 font-sans selection:bg-[#9ECD1D] selection:text-black">
        <div className="max-w-xl mx-auto pt-10">

          <header className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-[#9ECD1D] text-[10px] font-smart-detail mb-1">
                {isAdmin ? 'CONTROLE STAFF' : 'ÁREA DO ATLETA'}
              </p>
              <h1 className="text-3xl font-smart-title italic uppercase">
                Olá, <span className="text-[#9ECD1D]">{isAdmin ? 'Diretor' : 'Campeão'}</span>
              </h1>
              <p className="text-zinc-500 text-[10px] font-smart-detail mt-1 lowercase opacity-60">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-600 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer active:scale-95"
            >
              <LogOut size={20} />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`${styles.card} p-6 flex flex-col gap-4`}>
              <div className={`w-12 h-12 ${isAdmin ? 'bg-purple-500/10 text-purple-500' : 'bg-[#9ECD1D]/10 text-[#9ECD1D]'} rounded-2xl flex items-center justify-center`}>
                {isAdmin ? <ShieldCheck size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-smart-detail">STATUS</p>
                <p className="font-smart-title text-sm italic">{isAdmin ? 'ADMIN' : 'ATIVO'}</p>
              </div>
            </div>

            <div className={`${styles.card} p-6 flex flex-col gap-4`}>
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-smart-detail">UNIDADE</p>
                <p className="font-smart-title text-sm italic uppercase leading-tight">Smart Centervale</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={isAdmin ? () => router.push('/admin') : gerenciarAssinatura}
              disabled={loadingPortal}
              className={`w-full bg-zinc-900 border ${isAdmin ? 'border-purple-500/20' : 'border-zinc-800'} p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-zinc-800/50 transition-all group cursor-pointer active:scale-[0.99]`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 ${isAdmin ? 'bg-purple-600' : 'bg-[#9ECD1D]'} text-black rounded-3xl flex items-center justify-center shadow-lg`}>
                  {isAdmin ? <Activity size={28} /> : (loadingPortal ? <Loader2 className="animate-spin" /> : <CreditCard size={28} />)}
                </div>
                <div className="text-left">
                  <p className="font-smart-title text-lg italic uppercase">
                    {isAdmin ? 'Painel Gestor' : 'Pagamentos'}
                  </p>
                  <p className="text-zinc-500 text-[9px] font-smart-detail">
                    {isAdmin ? 'Estatísticas e Controle' : 'Histórico e Faturas'}
                  </p>
                </div>
              </div>
              <ChevronRight className={`text-zinc-800 group-hover:${isAdmin ? 'text-purple-500' : 'text-[#9ECD1D]'} transition-all group-hover:translate-x-1`} />
            </button>

            {!isAdmin && (
              <div className="w-full bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem] flex items-center justify-between opacity-40 grayscale">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-zinc-800 text-zinc-600 rounded-3xl flex items-center justify-center">
                    <Dumbbell size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-smart-title text-lg italic uppercase">Ficha de Treino</p>
                    <p className="text-zinc-500 text-[9px] font-smart-detail">Indisponível no momento</p>
                  </div>
                </div>
                <Lock size={18} className="text-zinc-800" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans">
      <div className={`${styles.card} max-w-md w-full p-10 shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9ECD1D]/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <header className="mb-10 relative">
          <h1 className="text-4xl font-smart-title italic uppercase tracking-tighter leading-none">
            SMART<span className="text-[#9ECD1D]">FIT</span>
          </h1>
          <div className="flex items-center gap-2 mt-4">
             <div className="h-[1px] w-6 bg-[#9ECD1D]" />
             <p className="text-zinc-500 text-[10px] font-smart-detail">ACESSO À UNIDADE</p>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-smart-detail animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {errorMsg.toUpperCase()}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
            <input
              required
              type="email"
              placeholder="E-MAIL CADASTRADO"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
            <input
              required
              type="password"
              placeholder="SUA SENHA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loadingLogin} className={styles.buttonPrimary}>
            {loadingLogin ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar Agora'}
          </button>
        </form>

        <footer className="mt-12 pt-6 border-t border-zinc-800/50">
          <p className="text-[9px] text-zinc-700 font-smart-detail text-center leading-relaxed">
            SISTEMA DE ACESSO BIOMÉTRICO <br/> SMART-FIT AI © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}