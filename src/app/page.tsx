'use client';

import { Check, ArrowRight, Lock, Mail, User, LayoutDashboard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import HomeSkeleton from '@/src/components/HomeSkeleton';

export default function Page() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [loading, setLoading] = useState(false);

  // Estilos Padronizados
  const styles = {
    input: "w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all placeholder:text-zinc-800 text-xs font-bold font-sans",
    buttonPrimary: "bg-[#9ECD1D] text-black font-smart-detail py-5 rounded-2xl uppercase text-[10px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50",
    card: "bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-sm"
  };

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
      // 1. Criar o utilizador no Auth com o nome nos metadados
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome, // Guarda o nome aqui para acesso rápido via useAuth
          }
        }
      });

      if (authError) throw authError;

      // 2. Inserir na tabela de alunos (BD) para gestão administrativa
      await supabase.from('alunos').insert([{
        nome: nome,
        email: email,
        status_assinatura: 'pendente',
        role: 'aluno'
      }]);

      // 3. Chamar o Checkout do Stripe
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPriceId, email }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;

    } catch (err: any) {
      alert(err.message || "Erro ao processar o registo.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <HomeSkeleton />;

  return (
    <div className="bg-zinc-950 text-white selection:bg-[#9ECD1D] selection:text-black min-h-screen font-sans">

      {/* --- MODAL DE SENHA PADRONIZADO --- */}
      {showAuth && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] max-w-sm w-full shadow-2xl relative">
            <h2 className="text-3xl font-smart-title mb-2 italic">Último Passo!</h2>
            <p className="text-zinc-500 text-[10px] font-smart-detail mb-8">Complete seus dados de acesso</p>

            <form onSubmit={(e) => { e.preventDefault(); finalizarContratacao(); }} className="space-y-4">

              {/* NOVO CAMPO DE NOME */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
                <input
                  required
                  type="text"
                  placeholder="SEU NOME COMPLETO"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
                <input type="email" disabled value={email} className="w-full bg-black/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-600 cursor-not-allowed text-xs font-bold font-sans" />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
                <input required type="password" placeholder="CRIE UMA SENHA" onChange={(e) => setPassword(e.target.value)} className={styles.input} />
              </div>

              <button type="submit" disabled={loading || password.length < 6 || !nome} className={`${styles.buttonPrimary} w-full mt-4`}>
                {loading ? <Loader2 className="animate-spin" /> : 'Pagar e Ativar'}
                <ArrowRight size={16} />
              </button>
            </form>
            {/* ... botão cancelar */}
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl relative">
          <p className="font-smart-detail text-[#9ECD1D] text-xs mb-6 animate-in slide-in-from-top-4 duration-700">Bem-vindo à nova era</p>
          <h1 className="text-6xl md:text-[10rem] font-smart-title mb-10 leading-[0.8] tracking-tighter">
            TREINE NO <br /> <span className="text-[#9ECD1D]">FUTURO.</span>
          </h1>

          {user ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <p className="font-smart-detail text-zinc-500 text-[10px] mb-10">Você já faz parte da revolução biométrica.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/perfil" className={`${styles.buttonPrimary} px-12`}>
                  <User size={18} /> Minha Conta
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="bg-zinc-900 border border-zinc-800 text-white font-smart-detail text-[10px] px-12 py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase">
                    <LayoutDashboard size={18} /> Painel Gestor
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-xl mx-auto">
              <p className="text-zinc-400 font-medium mb-10">Acesso 100% biométrico. <span className="text-white italic">Cadastre seu rosto e entre em qualquer unidade.</span></p>
              <form onSubmit={(e) => { e.preventDefault(); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-2 rounded-[2rem] border border-zinc-800 backdrop-blur-md">
                <input required type="email" placeholder="DIGITE SEU MELHOR E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent border-none rounded-2xl px-6 py-4 outline-none font-smart-detail text-[10px] placeholder:text-zinc-700" />
                <button type="submit" className={`${styles.buttonPrimary} px-10`}>
                  Ver Planos <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* --- SEÇÃO DE PLANOS --- */}
      {!user && (
        <section id="planos" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-20">
              <h3 className="font-smart-title text-5xl md:text-7xl mb-4 italic uppercase">Nossos Planos</h3>
              <p className="font-smart-detail text-[#9ECD1D] text-[10px]">Escolha como quer evoluir hoje</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <PlanCard title="BRONZE" price="89" features={["Musculação Completa", "Chuveiros Quentes"]} onSelect={() => abrirCheckout("price_ID_DO_BRONZE")} />

              {/* Plano de Destaque */}
              <div className="p-1 border-2 border-[#9ECD1D] rounded-[2.8rem] bg-[#9ECD1D]/5 scale-105 shadow-[0_0_50px_rgba(158,205,29,0.1)] relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#9ECD1D] text-black px-6 py-1.5 rounded-full font-smart-detail text-[9px]">O Mais Vendido</div>
                <div className="bg-zinc-900 p-10 rounded-[2.5rem] h-full flex flex-col">
                  <h4 className="font-smart-title text-2xl mb-2 text-[#9ECD1D]">SILVER</h4>
                  <div className="flex items-baseline mb-8">
                    <span className="text-6xl font-smart-title italic">R$129</span><span className="text-zinc-600 font-smart-detail text-[10px] ml-2">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center font-bold text-sm text-white"><Check className="mr-3 text-[#9ECD1D]" size={20} /> Todas as Unidades</li>
                    <li className="flex items-center text-sm text-zinc-400 font-medium"><Check className="mr-3 text-[#9ECD1D]/50" size={20} /> Aulas de Boxe e Yoga</li>
                    <li className="flex items-center text-sm text-zinc-400 font-medium"><Check className="mr-3 text-[#9ECD1D]/50" size={20} /> Leve 1 Convidado</li>
                  </ul>
                  <button onClick={() => abrirCheckout("price_1SvEajFDprPjycbd9WYNZUyX")} className={styles.buttonPrimary}>Assinar Silver</button>
                </div>
              </div>

              <PlanCard title="GOLD" price="199" features={["Tudo do Silver", "Personal Trainer", "Estacionamento VIP"]} onSelect={() => abrirCheckout("price_ID_DO_GOLD")} />
            </div>
          </div>
        </section>
      )}

      {/* FOOTER PADRONIZADO */}
      <footer className="py-24 border-t border-zinc-900 flex flex-col items-center gap-8 text-zinc-700 bg-black">
        <h2 className="font-smart-title text-2xl grayscale opacity-50 tracking-tighter">SMART<span className="text-white">FIT</span></h2>
        <div className="flex flex-col items-center gap-2">
          <p className="font-smart-detail text-[9px] uppercase tracking-[0.3em]">© 2026 Tecnologia Biométrica AI.</p>
          <Link href="/admin/login" className="hover:text-[#9ECD1D] text-[9px] font-smart-detail transition-colors underline underline-offset-4">Acesso Staff</Link>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({ title, price, features, onSelect }: any) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[2.5rem] flex flex-col hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group">
      <h4 className="font-smart-title text-2xl mb-2 italic uppercase group-hover:text-[#9ECD1D] transition-colors">{title}</h4>
      <div className="flex items-baseline mb-8">
        <span className="text-5xl font-smart-title italic">R${price}</span>
        <span className="text-zinc-600 font-smart-detail text-[10px] ml-2">/mês</span>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f: string) => (
          <li key={f} className="flex items-center text-sm text-zinc-500 font-medium">
            <Check className="w-5 h-5 text-zinc-800 mr-3" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} className="w-full cursor-pointer bg-zinc-800 text-zinc-400 font-smart-detail text-[10px] py-4 rounded-2xl uppercase hover:bg-zinc-700 hover:text-white transition-all">
        Assinar {title}
      </button>
    </div>
  );
}