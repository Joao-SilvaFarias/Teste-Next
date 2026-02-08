'use client';

import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import {
  Lock, Mail, CreditCard, LogOut, Loader2,
  Dumbbell, MapPin, CheckCircle2, AlertCircle, ChevronRight,
  ShieldCheck, Activity, Zap
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

  const styles = {
    card: "bg-[#0a0a0a] border border-white/5 rounded-[2rem]",
    input: "w-full bg-black border border-white/5 rounded-xl pl-12 pr-4 py-5 focus:border-[#9ECD1D]/50 outline-none transition-all placeholder:text-zinc-800 text-[11px] font-black italic uppercase tracking-widest text-white",
    buttonPrimary: "w-full bg-[#9ECD1D] flex justify-center items-center cursor-pointer text-black font-black italic py-5 rounded-xl mt-6 hover:shadow-[0_0_30px_rgba(158,205,29,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 uppercase text-[12px]"
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingLogin(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg("FALHA NA AUTENTICAÇÃO: CREDENCIAIS INVÁLIDAS.");
        setLoadingLogin(false);
        return;
      }
      setLoadingLogin(false);
    } catch (err) {
      setErrorMsg("ERRO DE CONEXÃO: SERVIDOR NÃO RESPONDE.");
      setLoadingLogin(false);
    }
  }

  async function handleLogout() {
    setLoadingLogin(false);
    setLoadingPortal(false);
    await signOut();
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
      else alert("SISTEMA DE PAGAMENTOS INDISPONÍVEL.");
    } catch (err) {
      alert("ERRO DE SINCRONIZAÇÃO COM O GATEWAY.");
    }
    setLoadingPortal(false);
  }

  if (authLoading) return <LoginSkeleton />;

  if (user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-6 pb-32 font-sans selection:bg-[#9ECD1D] selection:text-black">
        <div className="max-w-xl mx-auto pt-10">

          <header className="mb-12 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[#9ECD1D] rounded-full animate-pulse" />
                <p className="text-[#9ECD1D] text-[9px] font-black uppercase tracking-[0.4em]">
                   {isAdmin ? 'NÍVEL DE ACESSO // OPERADOR' : 'STATUS DO SISTEMA // ATIVO'}
                </p>
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                {isAdmin ? 'TERMINAL ' : 'ID_ATLETA '}<span className="text-[#9ECD1D]">BXVS</span>
              </h1>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-2 opacity-60 italic">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl text-zinc-700 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer active:scale-95 shadow-lg"
            >
              <LogOut size={20} />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className={`${styles.card} p-8 flex flex-col gap-5 relative overflow-hidden group`}>
               <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Zap size={60} />
               </div>
              <div className={`w-12 h-12 ${isAdmin ? 'bg-white text-black' : 'bg-[#9ECD1D]/10 text-[#9ECD1D]'} rounded-xl flex items-center justify-center border border-white/5`}>
                {isAdmin ? <ShieldCheck size={22} /> : <CheckCircle2 size={22} />}
              </div>
              <div>
                <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-1">CATEGORIA_ASSINATURA</p>
                <p className="font-black text-lg italic uppercase tracking-tighter leading-none">{isAdmin ? 'MODERADOR' : 'PATENTE SILVER'}</p>
              </div>
            </div>

            <div className={`${styles.card} p-8 flex flex-col gap-5 relative overflow-hidden`}>
              <div className="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center border border-white/5">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-1">UNIDADE_LOCAL</p>
                <p className="font-black text-lg italic uppercase tracking-tighter leading-none">PARNAÍBA_01</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={isAdmin ? () => router.push('/admin') : gerenciarAssinatura}
              disabled={loadingPortal}
              className={`w-full bg-[#0a0a0a] border ${isAdmin ? 'border-[#9ECD1D]/20' : 'border-white/5'} p-8 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/40 transition-all group cursor-pointer active:scale-[0.99] shadow-xl`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 ${isAdmin ? 'bg-white' : 'bg-[#9ECD1D]'} text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(158,205,29,0.2)]`}>
                  {isAdmin ? <Activity size={28} /> : (loadingPortal ? <Loader2 className="animate-spin" /> : <CreditCard size={28} />)}
                </div>
                <div className="text-left">
                  <p className="font-black text-xl italic uppercase tracking-tighter">
                    {isAdmin ? 'CENTRAL DE CONTROLE' : 'PORTAL FINANCEIRO'}
                  </p>
                  <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">
                    {isAdmin ? 'ESTATÍSTICAS E GESTÃO DE NODOS' : 'GERENCIAR CICLO DE COBRANÇA'}
                  </p>
                </div>
              </div>
              <ChevronRight className={`text-zinc-800 group-hover:${isAdmin ? 'text-white' : 'text-[#9ECD1D]'} transition-all group-hover:translate-x-2`} size={24} />
            </button>

            {!isAdmin && (
              <div className="w-full bg-[#0a0a0a]/40 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between opacity-30 grayscale cursor-not-allowed">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-2xl flex items-center justify-center">
                    <Dumbbell size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xl italic uppercase tracking-tighter">PROTOCOLO DE TREINO</p>
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1 italic">MÓDULO OFFLINE // EM DESENVOLVIMENTO</p>
                  </div>
                </div>
                <Lock size={20} className="text-zinc-800" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#9ECD1D]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <div className={`${styles.card} max-w-md w-full p-12 shadow-[0_40px_100px_rgba(0,0,0,1)] relative z-10 border-white/10`}>
        
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
            BOX<span className="text-[#9ECD1D]">VS</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-[2px] w-8 bg-[#9ECD1D]" />
             <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em]">SISTEMA DE AUTENTICAÇÃO RESTRITO</p>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-8 p-5 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center gap-4 text-red-500 text-[10px] font-black uppercase italic tracking-widest animate-in zoom-in-95">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={20} />
            <input
              required
              type="email"
              placeholder="IDENTIFICADOR (E-MAIL)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={20} />
            <input
              required
              type="password"
              placeholder="TOKEN DE ACESSO"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loadingLogin} className={styles.buttonPrimary}>
            {loadingLogin ? <Loader2 className="animate-spin w-6 h-6" /> : 'VALIDAR ACESSO'}
          </button>
        </form>

        <footer className="mt-16 pt-8 border-t border-white/5">
          <p className="text-[8px] text-zinc-800 font-black uppercase text-center tracking-[0.5em] leading-loose">
            ENCRIPTAÇÃO BIOMÉTRICA DE PONTA <br/> NÚCLEO BXVS © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}