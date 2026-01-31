'use client';

import { Check, Zap, Shield, Camera, ArrowRight, Lock, Mail, User, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados de Sessão
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLogged(true);
        const { data: perfil } = await supabase
          .from('alunos')
          .select('role')
          .eq('email', session.user.email)
          .maybeSingle();
        setIsAdmin(perfil?.role === 'admin');
      }
    }
    checkUser();
  }, []);

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
      // 1. Criar conta no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      console.log("Usuário criado no Auth. Tentando inserir na tabela alunos...");

      // 2. Tentar inserir na tabela pública 'alunos'
      const { error: dbError } = await supabase
        .from('alunos')
        .insert([
          {
            nome: email.split('@')[0],
            email: email,
            status_assinatura: 'pendente',
            face_descriptor: null,
            role: 'aluno'
          }
        ]);

      if (dbError) {
        console.error("Erro detalhado do banco:", dbError);
        // Não travamos o checkout por isso, mas avisamos no log
      } else {
        console.log("Perfil criado com sucesso na tabela alunos!");
      }

      // 3. Iniciar Checkout do Stripe
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPriceId, email }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;

    } catch (err: any) {
      console.error("Erro no processo:", err);
      alert(err.message || "Erro ao processar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-950 text-white selection:bg-[#9ECD1D] selection:text-black">

      {/* --- MODAL DE SENHA --- */}
      {showAuth && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black italic mb-2 uppercase">Último Passo!</h2>
            <p className="text-zinc-500 text-sm mb-6">Crie uma senha para acessar a academia e gerenciar seu plano.</p>

            {/* FORMULÁRIO PARA CAPTURAR O ENTER */}
            <form onSubmit={(e) => {
              e.preventDefault();
              finalizarContratacao();
            }}>
              <div className="space-y-4 mb-8">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-zinc-600" size={18} />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-[#9ECD1D]" size={18} />
                  <input
                    required
                    autoFocus // Já foca no campo de senha assim que o modal abre
                    type="password"
                    placeholder="Crie sua senha (mín. 6 caracteres)"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:border-[#9ECD1D] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit" // Agora este botão submete o form
                disabled={loading || password.length < 6}
                className="w-full cursor-pointer bg-[#9ECD1D] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-all"
              >
                {loading ? 'Processando...' : 'Pagar e Ativar Agora'}
                <ArrowRight size={16} />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowAuth(false)}
              className="w-full cursor-pointer mt-4 text-zinc-600 text-[10px] uppercase font-bold hover:text-zinc-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#9ECD1D15,_transparent_70%)] -z-10" />

        <div className="max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.85] italic">
            TREINE NO <br />
            <span className="text-[#9ECD1D]">FUTURO.</span>
          </h1>

          {isLogged ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Você já faz parte da revolução biométrica. Pronto para o treino de hoje?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/perfil" className="bg-[#9ECD1D] text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                  <User size={20} /> Minha Conta
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="bg-zinc-900 border border-zinc-800 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                    <LayoutDashboard size={20} /> Painel Gestor
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Acesso 100% biométrico. Pague, cadastre seu rosto e entre sem complicação.
              </p>

              {/* FORMULÁRIO DE CAPTURA INICIAL */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto"
              >
                <input
                  required
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#9ECD1D] transition-all"
                />

                <button
                  type="submit"
                  className="bg-[#9ECD1D] cursor-pointer text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap flex items-center justify-center gap-2"
                >
                  Ver Planos
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* --- SEÇÃO DE PLANOS (OCULTA SE LOGADO) --- */}
      {!isLogged && (
        <section id="planos" className="py-32 px-6 bg-zinc-950">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PlanCard title="BRONZE" price="89" features={["Musculação Completa", "Chuveiros Quentes"]} onSelect={() => abrirCheckout("price_ID_DO_BRONZE")} />

            <div className="p-10 rounded-[2.5rem] bg-zinc-900 border-2 border-[#9ECD1D] relative flex flex-col scale-110 shadow-2xl shadow-[#9ECD1D]/10">
              <div className="absolute -top-5 right-10 bg-[#9ECD1D] text-black px-4 py-1 rounded-full text-xs font-black uppercase">O Mais Vendido</div>
              <h4 className="text-xl font-bold mb-2">SILVER</h4>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black italic">R$129</span>
                <span className="text-zinc-500 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1 text-sm">
                <li className="flex items-center font-bold text-[#9ECD1D]"><Check className="w-5 h-5 mr-3" /> Todas as Unidades</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-[#9ECD1D] mr-3" /> Aulas de Boxe e Yoga</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-[#9ECD1D] mr-3" /> Leve 1 Convidado</li>
              </ul>
              <button onClick={() => abrirCheckout("price_1SvEajFDprPjycbd9WYNZUyX")} className="w-full cursor-pointer bg-[#9ECD1D] text-black py-4 rounded-2xl font-black uppercase hover:bg-[#8bb51a] transition-all shadow-lg shadow-[#9ECD1D]/20">
                Assinar Silver
              </button>
            </div>

            <PlanCard title="GOLD" price="199" features={["Tudo do Silver", "Personal Trainer", "Estacionamento VIP"]} onSelect={() => abrirCheckout("price_ID_DO_GOLD")} />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-20 border-t border-zinc-900 flex flex-col items-center gap-6">
        <p className="text-zinc-600 text-sm font-medium">© 2026 SMART-FIT AI. Tecnologia e Performance.</p>
        <Link href="/admin/login" className="text-zinc-700 hover:text-[#9ECD1D] text-[10px] font-black uppercase tracking-[0.2em] transition-all">
          Acesso Administrativo
        </Link>
      </footer>
    </div>
  );
}

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