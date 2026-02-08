'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle, ShieldAlert, ChevronLeft, Fingerprint } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminLogin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingInterno, setLoadingInterno] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, authLoading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingInterno(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'ACESSO NEGADO: CREDENCIAIS INVÁLIDAS' 
        : 'ERRO DE COMUNICAÇÃO COM O SERVIDOR');
      setLoadingInterno(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9ECD1D]/50 to-transparent opacity-20" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#9ECD1D]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        
        <header className="text-center mb-12 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a0a0a] border border-white/5 rounded-2xl mb-6 shadow-2xl">
            <ShieldAlert className="text-[#9ECD1D] w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            STAFF<span className="text-[#9ECD1D]">_AUTH</span>
          </h1>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.5em] mt-3">
            SISTEMA DE CONTROLE RESTRITO
          </p>
        </header>

        <form 
          onSubmit={handleLogin} 
          className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden"
        >
          {/* Alerta de Erro Tático */}
          {errorMsg && (
            <div className="bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black p-4 rounded-xl flex items-center gap-3 animate-shake uppercase italic tracking-widest">
              <AlertCircle size={16} strokeWidth={3} />
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-zinc-700 text-[8px] font-black uppercase ml-1 tracking-[0.3em]">Operator Identity</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL_DE_ACESSO"
                className="w-full bg-black border border-white/5 rounded-xl pl-12 pr-4 py-5 text-white focus:border-[#9ECD1D]/40 outline-none transition-all placeholder:text-zinc-900 text-[11px] font-black uppercase italic tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-700 text-[8px] font-black uppercase ml-1 tracking-[0.3em]">Access Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SENHA_MESTRA"
                className="w-full bg-black border border-white/5 rounded-xl pl-12 pr-4 py-5 text-white focus:border-[#9ECD1D]/40 outline-none transition-all placeholder:text-zinc-900 text-[11px] font-black uppercase italic tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingInterno || authLoading}
            className="w-full bg-[#9ECD1D] text-black font-black py-5 rounded-xl hover:shadow-[0_0_30px_rgba(158,205,29,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] disabled:opacity-50 mt-4 italic"
          >
            {loadingInterno ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <Fingerprint size={18} />
                Confirmar Login
              </>
            )}
          </button>
        </form>
        
        <footer className="text-center mt-10">
          <button 
            onClick={() => router.push('/')} 
            className="group flex items-center justify-center gap-2 mx-auto text-zinc-700 text-[9px] font-black uppercase hover:text-white transition-colors tracking-[0.3em]"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Terminal Público
          </button>
        </footer>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.15s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}