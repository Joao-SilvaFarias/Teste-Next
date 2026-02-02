'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    CheckCircle, XCircle, Activity, 
    TrendingUp, Loader2, UserPlus, ArrowRight,
    MessageCircle, DollarSign
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

// --- INTERFACES PARA CORRIGIR ERROS DE TYPESCRIPT ---
interface Aluno {
    nome: string;
    email: string;
    status_assinatura: string;
    created_at: string;
    telefone?: string;
}

interface DadoGrafico {
    hora: string;
    visitas: number;
}

export default function AdminDashboard() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState({ 
        ativos: 0, pendentes: 0, total: 0, novosNoMes: 0, churnRate: '0' 
    });
    
    // Tipagem dos states para evitar erros de ".map" ou ".find"
    const [dadosGrafico, setDadosGrafico] = useState<DadoGrafico[]>([]);
    const [alunosRecuperacao, setAlunosRecuperacao] = useState<Aluno[]>([]);
    const [carregandoDados, setCarregandoDados] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // Fix para o erro de hidratação do Recharts

    // 1. Fix de Hidratação (Recharts precisa rodar apenas no cliente)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Proteção de Rota
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/');
        }
    }, [isAdmin, authLoading, router]);

    // 3. Função de Cobrança WhatsApp
    const cobrarAluno = (aluno: Aluno) => {
        const telefoneLimpo = aluno.telefone?.replace(/\D/g, '');
        if (!telefoneLimpo) {
            alert("Aluno sem telefone cadastrado.");
            return;
        }
        const msg = encodeURIComponent(
            `Olá, ${aluno.nome}! Notamos que seu plano na academia está pendente. Vamos regularizar para você não perder o ritmo?`
        );
        window.open(`https://wa.me/55${telefoneLimpo}?text=${msg}`, '_blank');
    };

    // 4. Carregamento de Dados
    const carregarDados = useCallback(async () => {
        try {
            setCarregandoDados(true);
            const agora = new Date();
            const ontem = new Date();
            ontem.setHours(agora.getHours() - 24);
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

            const [alunosRes, checkinsRes] = await Promise.all([
                supabase.from('alunos').select('nome, email, status_assinatura, created_at, telefone'),
                supabase.from('checkins').select('data_hora').gte('data_hora', ontem.toISOString())
            ]);

            if (alunosRes.data) {
                const listaAlunos: Aluno[] = alunosRes.data;
                const total = listaAlunos.length;
                
                const ativos = listaAlunos.filter(a => 
                    String(a.status_assinatura || '').toLowerCase().trim() === 'ativo'
                ).length;

                const novosMes = listaAlunos.filter(a => 
                    a.created_at && new Date(a.created_at) >= inicioMes
                ).length;

                setStats({
                    ativos,
                    pendentes: total - ativos,
                    total,
                    novosNoMes: novosMes,
                    churnRate: total > 0 ? (((total - ativos) / total) * 100).toFixed(1) : '0'
                });

                setAlunosRecuperacao(listaAlunos
                    .filter(a => String(a.status_assinatura || '').toLowerCase().trim() !== 'ativo')
                    .slice(0, 4));
            }

            // Gráfico
            const esqueleto: DadoGrafico[] = [];
            for (let i = 12; i >= 0; i--) {
                const d = new Date();
                d.setHours(agora.getHours() - i);
                esqueleto.push({ hora: `${d.getHours()}:00`, visitas: 0 });
            }

            if (checkinsRes.data) {
                checkinsRes.data.forEach((c: { data_hora: string }) => {
                    const h = new Date(c.data_hora).getHours();
                    const ponto = esqueleto.find(p => p.hora === `${h}:00`);
                    if (ponto) ponto.visitas += 1;
                });
            }
            setDadosGrafico(esqueleto);
        } catch (error) {
            console.error("Erro no dashboard:", error);
        } finally {
            setCarregandoDados(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && isAdmin) carregarDados();
    }, [authLoading, isAdmin, carregarDados]);

    if (authLoading || !isMounted) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#9ECD1D] w-10 h-10" />
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 animate-in fade-in duration-700">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                        Estatísticas <span className="text-[#9ECD1D]">AI</span>
                    </h1>
                    <p className="text-zinc-500 font-medium italic">Gestão de performance em tempo real.</p>
                </div>
                <button onClick={carregarDados} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all">
                    <Activity size={20} className={carregandoDados ? "animate-spin text-[#9ECD1D]" : ""} />
                </button>
            </header>

            {/* GRÁFICO PRINCIPAL */}
            <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem] mb-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-[#9ECD1D]/10 rounded-lg"><TrendingUp className="text-[#9ECD1D]" size={20} /></div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Fluxo (12h)</h2>
                </div>
                <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dadosGrafico}>
                            <defs>
                                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9ECD1D" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#9ECD1D" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                            <XAxis dataKey="hora" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="visitas" stroke="#9ECD1D" strokeWidth={3} fill="url(#colorVis)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Receita Prevista" value={`R$ ${(stats.ativos * 129).toLocaleString()}`} icon={<DollarSign size={20} />} color="border-[#9ECD1D]/20" highlight />
                <MetricCard title="Novos no Mês" value={stats.novosNoMes} icon={<UserPlus size={20} />} color="border-zinc-800" />
                <MetricCard title="Alunos Ativos" value={stats.ativos} icon={<CheckCircle size={20} />} color="border-zinc-800" />
                <MetricCard title="Taxa de Churn" value={`${stats.churnRate}%`} icon={<XCircle size={20} />} color="border-zinc-800" />
            </div>

            {/* TABELA */}
            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Recuperação</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] bg-zinc-950/20">
                                <th className="px-8 py-4">Aluno</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {alunosRecuperacao.map((aluno, i) => (
                                <tr key={i} className="hover:bg-zinc-800/10 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold">{aluno.nome}</p>
                                        <p className="text-[10px] text-zinc-500">{aluno.email}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-black uppercase">
                                            {aluno.status_assinatura}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button onClick={() => cobrarAluno(aluno)} className="text-[#9ECD1D] text-xs font-black uppercase italic flex items-center gap-2 ml-auto">
                                            <MessageCircle size={16} /> WhatsApp
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

// Interface para as Props do Card
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    highlight?: boolean;
}

function MetricCard({ title, value, icon, color, highlight }: MetricCardProps) {
    return (
        <div className={`bg-zinc-900/40 border ${color} p-6 rounded-[2rem] flex items-center justify-between`}>
            <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
                <p className={`text-3xl font-black italic tracking-tighter ${highlight ? "text-[#9ECD1D]" : "text-white"}`}>{value}</p>
            </div>
            <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 text-zinc-400">{icon}</div>
        </div>
    );
}