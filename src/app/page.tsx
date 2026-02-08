'use client';

import { Check, ArrowRight, Lock, Mail, User, LayoutDashboard, Loader2, Zap, Shield, Globe } from 'lucide-react';
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

    // ESTILOS BXVS PARNAÍBA
    const styles = {
        input: "w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-12 pr-4 py-5 focus:border-[#9ECD1D]/50 outline-none transition-all placeholder:text-zinc-800 text-[11px] font-black italic uppercase tracking-widest",
        buttonPrimary: "bg-[#9ECD1D] text-black font-black py-5 rounded-xl uppercase text-[11px] italic flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(158,205,29,0.4)] active:scale-[0.98] transition-all disabled:opacity-50",
        card: "bg-zinc-900/10 border border-white/5 rounded-[2rem] p-10 backdrop-blur-sm hover:border-[#9ECD1D]/20 transition-all"
    };

    function abrirCheckout(priceId: string) {
        if (!email) {
            alert("INSIRA SEU E-MAIL NO TOPO DA PÁGINA PARA CONTINUAR.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSelectedPriceId(priceId);
        setShowAuth(true);
    }

    async function finalizarContratacao() {
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: nome } }
            });

            if (authError) throw authError;

            await supabase.from('alunos').insert([{
                nome: nome,
                email: email,
                status_assinatura: 'pendente',
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
            alert(err.message || "ERRO NO PROCESSAMENTO.");
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) return <HomeSkeleton />;

    return (
        <div className="bg-[#050505] text-white selection:bg-[#9ECD1D] selection:text-black min-h-screen font-sans overflow-x-hidden">

            {/* --- MODAL DE AUTH BXVS --- */}
            {showAuth && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,1)] relative">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">ÚLTIMO <br/><span className="text-[#9ECD1D]">PASSO.</span></h2>
                                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mt-3">Configuração de Perfil Biométrico</p>
                            </div>
                            <button onClick={() => setShowAuth(false)} className="text-zinc-800 hover:text-white transition-colors uppercase font-black text-[10px]">Fechar</button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); finalizarContratacao(); }} className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
                                <input required type="text" placeholder="NOME COMPLETO" value={nome} onChange={(e) => setNome(e.target.value)} className={styles.input} />
                            </div>

                            <div className="relative group opacity-60">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800" size={18} />
                                <input type="email" disabled value={email} className={styles.input + " cursor-not-allowed"} />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#9ECD1D] transition-colors" size={18} />
                                <input required type="password" placeholder="CRIAR SENHA (MÍN. 6 DÍGITOS)" onChange={(e) => setPassword(e.target.value)} className={styles.input} />
                            </div>

                            <button type="submit" disabled={loading || password.length < 6 || !nome} className={`${styles.buttonPrimary} w-full mt-6 py-6`}>
                                {loading ? <Loader2 className="animate-spin" /> : 'CONCLUIR E PAGAR'}
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20">
                {/* Efeito de Scanline e Grain */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
                
                <div className="max-w-6xl relative z-10">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-full mb-8 animate-in slide-in-from-top-10 duration-1000">
                        <span className="w-2 h-2 bg-[#9ECD1D] rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Parnaíba Unit // Now Active</p>
                    </div>

                    <h1 className="text-7xl md:text-[13rem] font-black mb-12 leading-[0.75] tracking-[ -0.05em] italic uppercase">
                        DOMINE A <br /> <span className="text-[#9ECD1D] drop-shadow-[0_0_30px_rgba(158,205,29,0.3)]">PISTA.</span>
                    </h1>

                    {user ? (
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                            <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[11px] mb-12">Sua sessão está ativa. Pronto para o próximo round?</p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                                <Link href="/perfil" className={`${styles.buttonPrimary} px-16`}>
                                    <User size={18} /> CENTRAL DO ATLETA
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" className="bg-white text-black font-black italic text-[11px] px-16 py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#9ECD1D] transition-all uppercase">
                                        <LayoutDashboard size={18} /> COMMAND CENTER
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-2xl mx-auto">
                            <p className="text-zinc-400 font-bold text-lg mb-12 uppercase italic tracking-tight">Onde a performance encontra a tecnologia. <br/> <span className="text-white">Acesso 100% biométrico. Sem chaves. Sem cartões.</span></p>
                            
                            <form onSubmit={(e) => { e.preventDefault(); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex flex-col sm:flex-row gap-4 bg-[#0a0a0a] p-3 rounded-2xl border border-white/10">
                                <input required type="email" placeholder="SEU MELHOR E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent border-none px-6 py-4 outline-none font-black italic text-[11px] placeholder:text-zinc-800 uppercase tracking-widest" />
                                <button type="submit" className={`${styles.buttonPrimary} px-10`}>
                                    VER PLANOS <ArrowRight size={18} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </section>

            {/* --- SEÇÃO DE PLANOS --- */}
            {!user && (
                <section id="planos" className="py-40 px-6 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col items-center mb-24">
                            <h3 className="text-6xl md:text-9xl font-black mb-4 italic uppercase tracking-tighter">PLANOS</h3>
                            <div className="h-1 w-24 bg-[#9ECD1D]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <PlanCard title="BRONZE" price="89" features={["Musculação Completa", "Acesso Unitário", "Vestiários Premium"]} onSelect={() => abrirCheckout("price_ID_DO_BRONZE")} />

                            {/* Plano de Destaque - SILVER */}
                            <div className="relative group scale-105 z-20">
                                <div className="absolute -inset-1 bg-[#9ECD1D] rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-[#0a0a0a] border-2 border-[#9ECD1D] p-12 rounded-[2.5rem] h-full flex flex-col shadow-2xl">
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#9ECD1D] text-black px-8 py-2 rounded-full font-black italic text-[10px] uppercase tracking-widest">Most Wanted</div>
                                    
                                    <h4 className="font-black italic text-4xl mb-2 text-[#9ECD1D] uppercase">SILVER</h4>
                                    <div className="flex items-baseline mb-12">
                                        <span className="text-7xl font-black italic tracking-tighter">R$129</span>
                                        <span className="text-zinc-700 font-black italic text-[12px] ml-2">/MÊS</span>
                                    </div>

                                    <ul className="space-y-6 mb-16 flex-1">
                                        <li className="flex items-center font-black italic text-[11px] text-white uppercase tracking-wider"><Check className="mr-4 text-[#9ECD1D]" size={20} strokeWidth={3} /> Acesso All Units</li>
                                        <li className="flex items-center font-black italic text-[11px] text-white uppercase tracking-wider"><Check className="mr-4 text-[#9ECD1D]" size={20} strokeWidth={3} /> Boxe & Performance</li>
                                        <li className="flex items-center font-black italic text-[11px] text-white uppercase tracking-wider"><Check className="mr-4 text-[#9ECD1D]" size={20} strokeWidth={3} /> 04 Convidados/mês</li>
                                    </ul>

                                    <button onClick={() => abrirCheckout("price_1SvEajFDprPjycbd9WYNZUyX")} className={`${styles.buttonPrimary} py-6 text-[13px]`}>
                                        ASSINAR SILVER
                                    </button>
                                </div>
                            </div>

                            <PlanCard title="GOLD" price="199" features={["Full Access", "Área VIP & Recovery", "Personal Trainer Inc.", "Estacionamento Livre"]} onSelect={() => abrirCheckout("price_ID_DO_GOLD")} />
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER BXVS */}
            <footer className="py-32 border-t border-white/5 flex flex-col items-center gap-12 bg-[#050505] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/10 via-transparent to-transparent opacity-50" />
                
                <h2 className="font-black text-6xl italic tracking-tighter opacity-10 uppercase">BOX VS</h2>
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="flex gap-10 text-zinc-600 font-black uppercase italic text-[10px] tracking-[0.3em]">
                        <span className="hover:text-[#9ECD1D] cursor-pointer transition-colors">Instagram</span>
                        <span className="hover:text-[#9ECD1D] cursor-pointer transition-colors">Support</span>
                        <span className="hover:text-[#9ECD1D] cursor-pointer transition-colors">Units</span>
                    </div>
                    <p className="text-zinc-800 font-black uppercase tracking-[0.4em] text-[9px]">© 2026 BXVS Intelligence System // Parnaíba</p>
                    <Link href="/admin/login" className="text-zinc-700 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors border-b border-zinc-900 pb-1">Staff Access Only</Link>
                </div>
            </footer>
        </div>
    );
}

function PlanCard({ title, price, features, onSelect }: any) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem] flex flex-col hover:border-white/20 transition-all group">
            <h4 className="font-black italic text-2xl mb-2 uppercase text-zinc-500 group-hover:text-white transition-colors">{title}</h4>
            <div className="flex items-baseline mb-10">
                <span className="text-5xl font-black italic tracking-tighter">R${price}</span>
                <span className="text-zinc-800 font-black italic text-[10px] ml-2">/MÊS</span>
            </div>
            <ul className="space-y-5 mb-12 flex-1">
                {features.map((f: string) => (
                    <li key={f} className="flex items-center text-[10px] text-zinc-600 font-black uppercase italic tracking-widest group-hover:text-zinc-400">
                        <Check className="w-4 h-4 text-zinc-900 mr-3" strokeWidth={3} /> {f}
                    </li>
                ))}
            </ul>
            <button onClick={onSelect} className="w-full bg-zinc-900/50 text-zinc-500 font-black italic text-[11px] py-5 rounded-xl uppercase hover:bg-white hover:text-black transition-all tracking-widest">
                ASSINAR {title}
            </button>
        </div>
    );
}