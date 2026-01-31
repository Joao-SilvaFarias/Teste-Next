'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Lock, Mail, CreditCard, LogOut, ArrowRight } from 'lucide-react';

export default function PerfilAluno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Função disparada pelo Form (aceita o Enter)
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault(); // Impede a página de recarregar
    setCarregando(true);
    
    const { data, error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
    }
    setCarregando(false);
  }

  async function gerenciarAssinatura() {
    setCarregando(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error);
    } catch (err) {
      alert("Erro ao conectar ao portal.");
    }
    setCarregando(false);
  }

  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-[#9ECD1D]/10 text-[#9ECD1D] rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase mb-2">Área do Aluno</h1>
          <p className="text-zinc-500 mb-8 text-sm">Logado como: <span className="text-zinc-300 font-bold">{user.email}</span></p>
          
          <button 
            onClick={gerenciarAssinatura}
            disabled={carregando}
            className="w-full bg-[#9ECD1D] text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {carregando ? 'Redirecionando...' : 'Gerenciar Assinatura'}
            <ArrowRight size={16} />
          </button>

          <button 
            onClick={() => supabase.auth.signOut().then(() => setUser(null))}
            className="mt-8 cursor-pointer text-zinc-600 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">
          SMART<span className="text-[#9ECD1D]">FIT</span>
        </h1>
        <p className="text-zinc-500 text-sm mb-8">
          {isLogin ? 'Faça login para gerenciar sua conta.' : 'Crie sua senha de acesso.'}
        </p>
        
        {/* ENVOLVENDO COM FORM PARA HABILITAR O ENTER */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-zinc-600" size={18} />
            <input 
              required
              type="email" 
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all"
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
              className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all"
            />
          </div>

          <button 
            type="submit" // Define explicitamente como o gatilho do formulário
            disabled={carregando}
            className="w-full bg-[#9ECD1D] cursor-pointer text-black font-black py-5 rounded-2xl mt-4 hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-[#9ECD1D]/10"
          >
            {carregando ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}