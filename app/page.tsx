'use client';

import { Check, Zap, Shield, Camera, ArrowRight, Lock, Mail, User, LayoutDashboard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext'; // Importando o contexto

export default function LandingPage() {
  const { user, isAdmin, loading: authLoading } = useAuth(); // Consumindo o estado global

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [loading, setLoading] = useState(false);

  function abrirCheckout(priceId: string) {
    if (!email) {
      alert("Por favor, digite seu e-mail no topo da página primeiro.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedPriceId(priceId);
    setShowAuth(true);
  }

  async function finalizarContratacao() {
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      await supabase.from('alunos').insert([{
        nome: email.split('@')[0],
        email: email,
        status_assinatura: 'pendente',
        face_descriptor: null,
        role: 'aluno'
      }]);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPriceId, email }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;

    } catch (err: any) {
      alert(err.message || "Erro ao processar.");
    } finally {
      setLoading(false);
    }
  }

  // Enquanto o contexto decide se o user está logado ou não
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#9ECD1D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white selection:bg-[#9ECD1D] selection:text-black">

      {/* --- MODAL DE SENHA --- */}
      {showAuth && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black italic mb-2 uppercase">Último Passo!</h2>
            <p className="text-zinc-500 text-sm mb-6">Crie uma senha para acessar a academia e gerenciar seu plano.</p>

            <form onSubmit={(e) => { e.preventDefault(); finalizarContratacao(); }}>
              <div className="space-y-4 mb-8">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-zinc-600" size={18} />
                  <input type="email" disabled value={email} className="w-full bg-black/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-400 cursor-not-allowed" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-[#9ECD1D]" size={18} />
                  <input required autoFocus type="password" placeholder="Crie sua senha" onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading || password.length < 6} className="w-full cursor-pointer bg-[#9ECD1D] text-black font-black py-5 rounded-2xl uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Processando...' : 'Pagar e Ativar Agora'}
                <ArrowRight size={16} />
              </button>
            </form>
            <button onClick={() => setShowAuth(false)} className="w-full mt-4 text-zinc-600 text-[10px] uppercase font-bold">Cancelar</button>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 italic leading-[0.85]">
            TREINE NO <br /> <span className="text-[#9ECD1D]">FUTURO.</span>
          </h1>

          {user ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <p className="text-lg text-zinc-400 mb-10">Você já faz parte da revolução biométrica.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/perfil" className="bg-[#9ECD1D] text-black px-10 py-5 rounded-2xl font-black uppercase flex items-center gap-2">
                  <User size={20} /> Minha Conta
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="bg-zinc-900 border border-zinc-800 text-white px-10 py-5 rounded-2xl font-black uppercase flex items-center gap-2">
                    <LayoutDashboard size={20} /> Painel Gestor
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <p className="text-lg text-zinc-400 mb-10">Acesso 100% biométrico. Cadastre seu rosto e entre.</p>
              <form onSubmit={(e) => { e.preventDefault(); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input required type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 focus:border-[#9ECD1D] outline-none" />
                <button
                  type="submit"
                  className="bg-[#9ECD1D] text-black px-8 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 whitespace-nowrap hover:scale-[1.02] transition-transform"
                >
                  <span className="flex items-center gap-1">
                    Ver <span>Planos</span>
                  </span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* --- SEÇÃO DE PLANOS (SÓ APARECE SE NÃO ESTIVER LOGADO) --- */}
      {!user && (
        <section id="planos" className="py-32 px-6 bg-zinc-950">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PlanCard title="BRONZE" price="89" features={["Musculação Completa", "Chuveiros Quentes"]} onSelect={() => abrirCheckout("price_ID_DO_BRONZE")} />

            <div className="p-10 rounded-[2.5rem] bg-zinc-900 border-2 border-[#9ECD1D] relative flex flex-col scale-110 shadow-2xl">
              <div className="absolute -top-5 right-10 bg-[#9ECD1D] text-black px-4 py-1 rounded-full text-xs font-black uppercase">O Mais Vendido</div>
              <h4 className="text-xl font-bold mb-2">SILVER</h4>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black italic">R$129</span><span className="text-zinc-500 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1 text-sm">
                <li className="flex items-center font-bold text-[#9ECD1D]"><Check className="mr-3" /> Todas as Unidades</li>
                <li className="flex items-center"><Check className="mr-3" /> Aulas de Boxe e Yoga</li>
                <li className="flex items-center"><Check className="mr-3" /> Leve 1 Convidado</li>
              </ul>
              <button onClick={() => abrirCheckout("price_1SvEajFDprPjycbd9WYNZUyX")} className="w-full bg-[#9ECD1D] text-black py-4 rounded-2xl font-black uppercase">Assinar Silver</button>
            </div>

            <PlanCard title="GOLD" price="199" features={["Tudo do Silver", "Personal Trainer", "Estacionamento VIP"]} onSelect={() => abrirCheckout("price_ID_DO_GOLD")} />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-20 border-t border-zinc-900 flex flex-col items-center gap-6 text-zinc-600 text-sm">
        <p>© 2026 SMART-FIT AI. Tecnologia e Performance.</p>
        <Link href="/admin/login" className="hover:text-[#9ECD1D] text-[10px] font-black uppercase tracking-[0.2em]">Acesso Administrativo</Link>
      </footer>
    </div>
  );
}

// O componente PlanCard permanece o mesmo...
function PlanCard({ title, price, features, onSelect }: any) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800 flex flex-col hover:border-zinc-700 transition-all">
      <h4 className="text-xl font-bold mb-2 uppercase">{title}</h4>
      <div className="flex items-baseline mb-8">
        <span className="text-5xl font-black italic">R${price}</span>
        <span className="text-zinc-500 ml-2">/mês</span>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f: string) => (
          <li key={f} className="flex items-center text-sm text-zinc-400">
            <Check className="w-5 h-5 text-[#9ECD1D] mr-3 opacity-50" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} className="w-full cursor-pointer bg-zinc-800 py-4 rounded-2xl font-black uppercase hover:bg-zinc-700 transition-all">
        Assinar {title}
      </button>
    </div>
  );
}