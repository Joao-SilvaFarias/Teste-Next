'use client';

import { Check, Zap, Shield, Camera } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {

  const [email, setEmail] = useState('');
  // Dentro da sua Landing Page
  async function handleAssinar(priceId: string) {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Erro no clique:", err);
      alert("Falha ao iniciar pagamento: " + err.message);
    }
  }

  return (
    <div className="bg-zinc-950 text-white selection:bg-yellow-400 selection:text-black">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Efeito de luz de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent -z-10" />

        <div className="text-center max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            TREINE NO <br />
            <span className="text-yellow-400">FUTURO.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A primeira academia com acesso 100% biométrico. Pague via Stripe, cadastre seu rosto e entre sem chaves, digitais ou complicação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-yellow-400 transition-all"
            />
            <a href="#planos" className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-300 transition-all whitespace-nowrap">
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* --- DIFERENCIAIS --- */}
      <section className="py-24 border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="text-yellow-400 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Acesso Instantâneo</h3>
            <p className="text-zinc-500 text-sm">Pague e libere seu cadastro em menos de 2 minutos.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="text-yellow-400 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Tecnologia Facial</h3>
            <p className="text-zinc-500 text-sm">Nada de carregar cartões ou tocar em leitores sujos.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="text-yellow-400 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Segurança Total</h3>
            <p className="text-zinc-500 text-sm">Seus dados são criptografados e processados via IA.</p>
          </div>
        </div>
      </section>

      {/* --- SEÇÃO DE PLANOS (O CORAÇÃO DA PÁGINA) --- */}
      <section id="planos" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tighter mb-4 italic">NOSSOS PLANOS</h2>
            <div className="h-1.5 w-24 bg-yellow-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PLANO BRONZE */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800 flex flex-col">
              <h4 className="text-xl font-bold mb-2">BRONZE</h4>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black">R$89</span>
                <span className="text-zinc-500 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Musculação Completa</li>
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Chuveiros Quentes</li>
              </ul>
              <button className="w-full bg-zinc-800 py-4 rounded-2xl font-black uppercase hover:bg-zinc-700 transition-all">Assinar Bronze</button>
            </div>

            {/* PLANO SILVER (DESTAQUE) */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900 border-2 border-yellow-400 relative flex flex-col scale-110 shadow-2xl shadow-yellow-400/10">
              <div className="absolute -top-5 right-10 bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter">O Mais Vendido</div>
              <h4 className="text-xl font-bold mb-2">SILVER</h4>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black">R$129</span>
                <span className="text-zinc-500 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center text-sm font-bold text-yellow-400"><Check className="w-5 h-5 mr-3" /> Acesso a Todas as Unidades</li>
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Aulas de Boxe e Yoga</li>
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Leve 1 Convidado p/ mês</li>
              </ul>
              <button className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20" onClick={() => handleAssinar("price_1SuIEEFDprPjycbd11vUtKg6")}>Assinar Silver</button>
            </div>

            {/* PLANO GOLD */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800 flex flex-col">
              <h4 className="text-xl font-bold mb-2">GOLD</h4>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black">R$199</span>
                <span className="text-zinc-500 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Tudo do Plano Silver</li>
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Personal Trainer Exclusivo</li>
                <li className="flex items-center text-sm"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Estacionamento VIP</li>
              </ul>
              <button className="w-full bg-zinc-800 py-4 rounded-2xl font-black uppercase hover:bg-zinc-700 transition-all">Assinar Gold</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-zinc-900 flex flex-col items-center gap-4">
        <p className="text-zinc-600 text-sm">© 2024 SMART-FIT AI. Todos os direitos reservados.</p>
        <Link
          href="/admin/login"
          className="text-zinc-700 hover:text-yellow-400 text-xs font-bold uppercase tracking-tighter transition-all"
        >
          Acesso Administrativo
        </Link>
      </footer>
    </div>

  );
}