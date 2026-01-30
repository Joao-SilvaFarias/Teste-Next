'use client';

import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao entrar: ' + error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
            ADMIN<span className="text-yellow-400">LOGIN</span>
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
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-yellow-400 outline-none transition-all"
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
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-yellow-400 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}