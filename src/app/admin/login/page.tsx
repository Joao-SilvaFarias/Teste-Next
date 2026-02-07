'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
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
      
      // O useEffect cuidará do redirecionamento assim que o Supabase 
      // disparar o evento de mudança de estado captado pelo seu Context.
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : 'Erro ao conectar ao servidor.');
      setLoadingInterno(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter">
            ADMIN<span className="text-[#9ECD1D]">GATE</span>
          </h1>
          <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.3em] mt-2">
            Restricted Access Area
          </p>
        </header>

        <form 
          onSubmit={handleLogin} 
          className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl space-y-5"
        >
          {/* Alerta de Erro */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-zinc-500 text-[10px] font-black uppercase ml-1 tracking-widest">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-[#9ECD1D] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@academia.com"
                className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-[#9ECD1D] focus:ring-1 focus:ring-[#9ECD1D]/20 outline-none transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-500 text-[10px] font-black uppercase ml-1 tracking-widest">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-[#9ECD1D] transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-[#9ECD1D] focus:ring-1 focus:ring-[#9ECD1D]/20 outline-none transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingInterno || authLoading}
            className="w-full bg-[#9ECD1D] text-black font-black py-5 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50 mt-4"
          >
            {loadingInterno ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              'Autenticar Operador'
            )}
          </button>
        </form>
        
        <footer className="text-center mt-8">
          <button 
            onClick={() => router.push('/')} 
            className="text-zinc-700 text-[10px] font-bold uppercase hover:text-[#9ECD1D] transition-colors tracking-widest"
          >
            ← Voltar ao Terminal Público
          </button>
        </footer>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}