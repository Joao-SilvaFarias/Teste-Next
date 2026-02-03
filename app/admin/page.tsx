'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    CheckCircle, XCircle, Activity, TrendingUp, Loader2, 
    MessageCircle, DollarSign, Clock, LogOut, Users, 
    Search, FileDown, UserX, Zap, Info 
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- INTERFACES ---
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

interface AlunoPresente {
    aluno_nome: string;
    email: string;
    data_hora: string;
    tipo: string;
}

export default function AdminDashboard() {
    const { isAdmin, loading: authLoading, user } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState({ 
        ativos: 0, pendentes: 0, total: 0, novosNoMes: 0, churnRate: '0' 
    });
    
    const [dadosGrafico, setDadosGrafico] = useState<DadoGrafico[]>([]);
    const [alunosRecuperacao, setAlunosRecuperacao] = useState<Aluno[]>([]);
    const [alunosEmRisco, setAlunosEmRisco] = useState<Aluno[]>([]);
    const [presentes, setPresentes] = useState<AlunoPresente[]>([]);
    const [carregandoDados, setCarregandoDados] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (!authLoading && !isAdmin) router.replace('/');
    }, [isAdmin, authLoading, router]);

    const buscarPresentes = useCallback(async () => {
        const { data } = await supabase.from('alunos_presentes').select('*');
        setPresentes(data || []);
    }, []);

    const carregarDadosGerais = useCallback(async () => {
        try {
            setCarregandoDados(true);
            const agora = new Date();
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(agora.getDate() - 7);
            const ontem = new Date();
            ontem.setHours(agora.getHours() - 24);
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

            const [alunosRes, checkinsRes, ultimosAcessos] = await Promise.all([
                supabase.from('alunos').select('*'),
                supabase.from('checkins').select('data_hora').gte('data_hora', ontem.toISOString()),
                supabase.from('checkins').select('email, data_hora').order('data_hora', { ascending: false })
            ]);

            if (alunosRes.data) {
                const lista: Aluno[] = alunosRes.data;
                const ativos = lista.filter(a => a.status_assinatura?.toLowerCase().trim() === 'ativo').length;
                const novosMes = lista.filter(a => a.created_at && new Date(a.created_at) >= inicioMes).length;

                setStats({
                    ativos,
                    pendentes: lista.length - ativos,
                    total: lista.length,
                    novosNoMes: novosMes,
                    churnRate: lista.length > 0 ? (((lista.length - ativos) / lista.length) * 100).toFixed(1) : '0'
                });

                setAlunosRecuperacao(lista.filter(a => a.status_assinatura?.toLowerCase().trim() !== 'ativo'));

                // Lógica de Risco: Alunos ativos que não aparecem há mais de 7 dias
                const emailsComAcessoRecente = new Set(ultimosAcessos.data?.filter(c => new Date(c.data_hora) > seteDiasAtras).map(c => c.email));
                setAlunosEmRisco(lista.filter(a => a.status_assinatura === 'ativo' && !emailsComAcessoRecente.has(a.email) && a.email !== user?.email).slice(0, 5));
            }

            // Gráfico de Fluxo
            const esqueleto: DadoGrafico[] = [];
            for (let i = 12; i >= 0; i--) {
                const d = new Date();
                d.setHours(agora.getHours() - i);
                esqueleto.push({ hora: `${d.getHours()}:00`, visitas: 0 });
            }

            if (checkinsRes.data) {
                checkinsRes.data.forEach((c: any) => {
                    const h = new Date(c.data_hora).getHours();
                    const ponto = esqueleto.find(p => p.hora === `${h}:00`);
                    if (ponto) ponto.visitas += 0.5;
                });
            }
            setDadosGrafico(esqueleto);
        } catch (error) {
            console.error(error);
        } finally {
            setCarregandoDados(false);
        }
    }, [user?.email]);

    useEffect(() => {
        if (!authLoading && isAdmin) {
            carregarDadosGerais();
            buscarPresentes();
            const canal = supabase.channel('admin-realtime')
                .on('postgres_changes', { event: 'INSERT', table: 'checkins' }, () => {
                    buscarPresentes();
                    carregarDadosGerais();
                }).subscribe();
            return () => { supabase.removeChannel(canal); };
        }
    }, [authLoading, isAdmin, carregarDadosGerais, buscarPresentes]);

    const presentesFiltrados = useMemo(() => {
        return presentes.filter(a => a.aluno_nome.toLowerCase().includes(termoPesquisa.toLowerCase()));
    }, [presentes, termoPesquisa]);

    const recuperacaoFiltrada = useMemo(() => {
        return alunosRecuperacao
            .filter(aluno => aluno.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) && aluno.email !== user?.email)
            .slice(0, 10);
    }, [alunosRecuperacao, termoPesquisa, user?.email]);

    const gerarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Relatorio de Gestao - Academia AI", 14, 20);
        autoTable(doc, {
            startY: 35,
            head: [['Metrica', 'Valor']],
            body: [
                ['Alunos Ativos', stats.ativos.toString()],
                ['Receita Mensal Prevista', `R$ ${(stats.ativos * 129).toLocaleString()}`],
                ['Alunos Presentes Agora', presentes.length.toString()],
                ['Taxa de Churn', `${stats.churnRate}%`]
            ],
            theme: 'striped',
            headStyles: { fill: [158, 205, 29] }
        });
        doc.save(`relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const cobrarAluno = (aluno: Aluno) => {
        const tel = aluno.telefone?.replace(/\D/g, '');
        if (!tel) return alert("Sem telefone cadastrado.");
        window.open(`https://wa.me/55${tel}?text=Ola%20${aluno.nome},%20vimos%20que%20seu%20plano%20precisa%20de%20atencao.`, '_blank');
    };

    const forcarCheckout = async (aluno: AlunoPresente) => {
        if(!confirm(`Deseja realizar o checkout manual de ${aluno.aluno_nome}?`)) return;
        await supabase.from('checkins').insert([{
            email: aluno.email, aluno_nome: aluno.aluno_nome, tipo: 'saida', data_hora: new Date().toISOString()
        }]);
        buscarPresentes();
    };

    if (authLoading || !isMounted) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-[#9ECD1D] w-10 h-10" /></div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 font-sans">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="px-2 py-0.5 bg-[#9ECD1D]/10 text-[#9ECD1D] text-[10px] font-bold rounded-full uppercase tracking-widest border border-[#9ECD1D]/20 mb-2 inline-block">Admin Mode</span>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Command <span className="text-[#9ECD1D]">Center</span></h1>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={gerarPDF} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all">
                        <FileDown size={18} /> PDF
                    </button>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                            type="text" placeholder="Buscar aluno..." 
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-[#9ECD1D] outline-none w-64 transition-all focus:w-80"
                            value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard title="Receita Estimada" value={`R$ ${(stats.ativos * 129).toLocaleString()}`} icon={<DollarSign size={18}/>} color="border-[#9ECD1D]/20" highlight />
                <MetricCard title="Alunos Ativos" value={stats.ativos} icon={<Users size={18}/>} color="border-zinc-800" />
                <MetricCard title="Ocupação Atual" value={`${Math.min(100, (presentes.length / 50) * 100).toFixed(0)}%`} icon={<Zap size={18}/>} color="border-zinc-800" />
                <MetricCard title="Taxa de Churn" value={`${stats.churnRate}%`} icon={<TrendingUp size={18}/>} color="border-red-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LADO ESQUERDO: GRÁFICO E PRESENÇA */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Activity size={16} className="text-[#9ECD1D]" /> Fluxo de Frequência (24h)
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadosGrafico}>
                                    <defs>
                                        <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9ECD1D" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#9ECD1D" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="hora" stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: 'none', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="visitas" stroke="#9ECD1D" strokeWidth={3} fill="url(#colorVis)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest italic text-zinc-400 mb-6 px-2">Treinando Agora ({presentes.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {presentesFiltrados.map((aluno) => (
                                <div key={aluno.email} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl flex items-center justify-between group hover:border-[#9ECD1D]/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#9ECD1D] rounded-xl flex items-center justify-center text-black font-black">{aluno.aluno_nome[0]}</div>
                                        <div>
                                            <p className="text-sm font-bold uppercase italic">{aluno.aluno_nome}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium italic">Desde as {new Date(aluno.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => forcarCheckout(aluno)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* LADO DIREITO: ALERTAS E RISCOS */}
                <div className="space-y-6">
                    {/* ALERTA DE EVASÃO */}
                    <section className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2.5rem]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                            <UserX size={16} /> Risco de Abandono
                        </h3>
                        <div className="space-y-4">
                            {alunosEmRisco.length > 0 ? alunosEmRisco.map((aluno, i) => (
                                <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-2xl">
                                    <div>
                                        <p className="text-xs font-bold uppercase">{aluno.nome.split(' ')[0]}</p>
                                        <p className="text-[9px] text-zinc-500 italic">+7 dias ausente</p>
                                    </div>
                                    <button onClick={() => cobrarAluno(aluno)} className="p-2 bg-white text-black rounded-lg hover:bg-[#9ECD1D] transition-colors">
                                        <MessageCircle size={14} />
                                    </button>
                                </div>
                            )) : <p className="text-[10px] text-zinc-600 italic px-2">Engajamento está alto!</p>}
                        </div>
                    </section>

                    {/* COBRANÇA */}
                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#9ECD1D] mb-6 flex items-center gap-2">
                            <Info size={16} /> Ações Requeridas
                        </h3>
                        <div className="space-y-3">
                            {recuperacaoFiltrada.map((aluno, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0">
                                    <div className="max-w-[120px]">
                                        <p className="text-xs font-bold uppercase truncate">{aluno.nome}</p>
                                        <p className="text-[9px] text-red-500 font-bold uppercase">{aluno.status_assinatura}</p>
                                    </div>
                                    <button onClick={() => cobrarAluno(aluno)} className="text-[10px] font-black text-[#9ECD1D] uppercase border border-[#9ECD1D]/20 px-3 py-1.5 rounded-xl hover:bg-[#9ECD1D] hover:text-black transition-all">
                                        Cobrar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color, highlight }: any) {
    return (
        <div className={`bg-zinc-900/40 border ${color} p-6 rounded-[2rem] flex items-center justify-between`}>
            <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                <p className={`text-2xl font-black italic tracking-tighter ${highlight ? "text-[#9ECD1D]" : "text-white"}`}>{value}</p>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 text-zinc-400">{icon}</div>
        </div>
    );
}