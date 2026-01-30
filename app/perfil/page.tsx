'use client';
import { useState } from 'react';

export default function PerfilAluno() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function gerenciarAssinatura() {
    setCarregando(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Erro ao conectar ao portal.");
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-2xl font-black mb-6 uppercase tracking-tight">Minha Conta</h1>
        
        <label className="block text-zinc-500 text-sm mb-2">Confirme seu e-mail de aluno:</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="exemplo@email.com"
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 mb-6 focus:border-yellow-400 outline-none transition-all"
        />

        <button 
          onClick={gerenciarAssinatura}
          disabled={carregando}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {carregando ? 'Carregando...' : 'Gerenciar Pagamentos e Cancelar'}
        </button>

        <p className="mt-6 text-zinc-500 text-xs text-center leading-relaxed">
          Você será redirecionado para o ambiente seguro do Stripe para alterar dados de cobrança ou cancelar sua assinatura.
        </p>
      </div>
    </div>
  );
}