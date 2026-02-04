"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, Activity, TrendingUp, Loader2,
    MessageCircle, DollarSign, Clock, LogOut, Users,
    Search, FileDown, UserX, Zap, Info, Camera
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageSkeleton from '@/components/PageSkeleton';
import DashboardSkeleton from '@/components/DashboardSkeleton';

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

export default function DashboardContent() {
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
    const [agoraParaTimer, setAgoraParaTimer] = useState(new Date());
    const [showModalEncerrar, setShowModalEncerrar] = useState(false);
    const [encerrando, setEncerrando] = useState(false);

    const confirmarEncerrarDia = async () => {
        setEncerrando(true);
        try {
            const { error } = await supabase.rpc('realizar_auto_checkout');
            if (error) throw error;
            buscarPresentes();
            setShowModalEncerrar(false);
        } catch (error: any) {
            alert("Erro ao encerrar dia: " + error.message);
        } finally {
            setEncerrando(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setAgoraParaTimer(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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

                const emailsComAcessoRecente = new Set(ultimosAcessos.data?.filter(c => new Date(c.data_hora) > seteDiasAtras).map(c => c.email));
                setAlunosEmRisco(lista.filter(a => a.status_assinatura === 'ativo' && !emailsComAcessoRecente.has(a.email) && a.email !== user?.email).slice(0, 5));
            }

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
                    if (ponto) ponto.visitas += 1;
                });
            }
            setDadosGrafico(esqueleto);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setCarregandoDados(false);
        }
    }, [user?.email]);

    useEffect(() => {
        if (!authLoading && isAdmin) {
            carregarDadosGerais();
            buscarPresentes();
            const canal = supabase.channel('admin-changes')
                .on('postgres_changes', { event: '*', table: 'checkins', schema: 'public' }, () => {
                    buscarPresentes();
                    carregarDadosGerais();
                }).subscribe();
            return () => { supabase.removeChannel(canal); };
        }
    }, [authLoading, isAdmin, carregarDadosGerais, buscarPresentes]);

    const horarioPico = useMemo(() => {
        if (dadosGrafico.length === 0) return "--:--";
        const maior = [...dadosGrafico].sort((a, b) => b.visitas - a.visitas)[0];
        return maior?.visitas > 0 ? maior.hora : "--:--";
    }, [dadosGrafico]);

    const presentesFiltrados = useMemo(() => {
        return presentes.filter(a => a.aluno_nome.toLowerCase().includes(termoPesquisa.toLowerCase()));
    }, [presentes, termoPesquisa]);

    const recuperacaoFiltrada = useMemo(() => {
        return alunosRecuperacao.filter(aluno => aluno.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) && aluno.email !== user?.email).slice(0, 10);
    }, [alunosRecuperacao, termoPesquisa, user?.email]);

    const gerarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Relatorio de Gestao - SmartFit Clone", 14, 20);
        autoTable(doc, {
            startY: 35,
            head: [['Metrica', 'Valor']],
            body: [
                ['Alunos Ativos', stats.ativos.toString()],
                ['Receita Mensal Prevista', `R$ ${(stats.ativos * 129).toLocaleString()}`],
                ['Alunos Presentes Agora', presentes.length.toString()],
                ['Horario de Pico (24h)', horarioPico],
                ['Taxa de Churn', `${stats.churnRate}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [158, 205, 29] }
        });
        doc.save(`dashboard-admin-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const cobrarAluno = (aluno: Aluno) => {
        const tel = aluno.telefone?.replace(/\D/g, '');
        if (!tel) return alert("Sem telefone cadastrado.");
        window.open(`https://wa.me/55${tel}?text=Ola%20${aluno.nome},%20vimos%20que%20seu%20plano%20precisa%20de%20atencao.`, '_blank');
    };

    const forcarCheckout = async (aluno: AlunoPresente) => {
        if (!confirm(`Deseja realizar o checkout manual de ${aluno.aluno_nome}?`)) return;
        await supabase.from('checkins').insert([{
            email: aluno.email, aluno_nome: aluno.aluno_nome, tipo: 'saida', data_hora: new Date().toISOString()
        }]);
    };

    if (authLoading || carregandoDados || !isMounted) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 font-sans animate-in fade-in duration-700">
            
            {/* BOTÃO FLUTUANTE DE ACESSO RÁPIDO À CÂMERA */}
            <button
                onClick={() => router.push('/admin/recepcao')}
                className="fixed bottom-8 right-8 z-[90] w-16 h-16 bg-[#9ECD1D] text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(158,205,29,0.4)] hover:scale-110 active:scale-95 transition-all border-4 border-zinc-950 group"
            >
                <Camera size={28} />
                <span className="absolute right-20 bg-zinc-900 text-[#9ECD1D] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Scanner Facial
                </span>
            </button>

            {/* Modal de Confirmação Personalizado */}
            {showModalEncerrar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[3rem] shadow-2xl scale-in-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <LogOut size={32} />
                        </div>

                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center mb-2">
                            Encerrar <span className="text-red-500">Operação?</span>
                        </h2>

                        <p className="text-zinc-400 text-sm text-center mb-8 leading-relaxed">
                            Esta ação realizará o <span className="text-white font-bold">checkout automático</span> de todos os <span className="text-white font-bold">{presentes.length} alunos</span> presentes agora. Use apenas ao fechar a academia.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmarEncerrarDia}
                                disabled={encerrando}
                                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                            >
                                {encerrando ? <Loader2 className="animate-spin" size={16} /> : "Confirmar Encerramento"}
                            </button>

                            <button
                                onClick={() => setShowModalEncerrar(false)}
                                disabled={encerrando}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-4 rounded-2xl uppercase tracking-widest text-xs transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="px-2 py-0.5 bg-[#9ECD1D]/10 text-[#9ECD1D] text-[10px] font-bold rounded-full uppercase tracking-widest border border-[#9ECD1D]/20 mb-2 inline-block">Admin Mode</span>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Command <span className="text-[#9ECD1D]">Center</span></h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    <button onClick={() => setShowModalEncerrar(true)} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl font-bold text-xs text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <LogOut size={16} /> Encerrar Dia
                    </button>
                    <button onClick={gerarPDF} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl font-bold text-xs hover:bg-zinc-800 transition-all text-zinc-400">
                        <FileDown size={16} /> Exportar
                    </button>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text" placeholder="Buscar aluno..."
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-11 pr-4 text-xs focus:border-[#9ECD1D] outline-none w-48 sm:w-64 transition-all focus:w-80"
                            value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard title="Receita Prevista" value={`R$ ${(stats.ativos * 129).toLocaleString()}`} icon={<DollarSign size={18} />} color="border-[#9ECD1D]/20" highlight />
                <MetricCard title="Alunos Ativos" value={stats.ativos} icon={<Users size={18} />} color="border-zinc-800" />
                <MetricCard title="Horário de Pico" value={horarioPico} icon={<Clock size={18} />} color="border-zinc-800" />
                <MetricCard title="Taxa de Churn" value={`${stats.churnRate}%`} icon={<TrendingUp size={18} />} color="border-red-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Activity size={16} className="text-[#9ECD1D]" /> Movimentação 24h
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadosGrafico}>
                                    <defs>
                                        <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9ECD1D" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#9ECD1D" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="hora" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="visitas" stroke="#9ECD1D" strokeWidth={3} fill="url(#colorVis)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest italic text-zinc-400 mb-6 px-2">
                            No Shape Agora ({presentes.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {presentesFiltrados.map((aluno) => {
                                const tempoPermanencia = Math.floor((agoraParaTimer.getTime() - new Date(aluno.data_hora).getTime()) / 60000);
                                return (
                                    <div key={aluno.email} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl flex items-center justify-between group hover:border-[#9ECD1D]/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-[#9ECD1D] font-black border border-white/5 uppercase">
                                                    {aluno.aluno_nome[0]}
                                                </div>
                                                {tempoPermanencia > 90 && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold uppercase italic leading-none mb-1">{aluno.aluno_nome}</p>
                                                <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-tighter italic">
                                                    Há {tempoPermanencia} min treinando
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => forcarCheckout(aluno)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
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
                            )) : <p className="text-[10px] text-zinc-600 italic px-2">Todos engajados!</p>}
                        </div>
                    </section>

                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#9ECD1D] mb-6 flex items-center gap-2">
                            <Info size={16} /> Recuperação
                        </h3>
                        <div className="space-y-3">
                            {recuperacaoFiltrada.map((aluno, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0">
                                    <div className="max-w-[120px]">
                                        <p className="text-xs font-bold uppercase truncate">{aluno.nome}</p>
                                        <p className="text-[9px] text-red-500 font-bold uppercase">{aluno.status_assinatura}</p>
                                    </div>
                                    <button onClick={() => cobrarAluno(aluno)} className="text-[9px] font-black text-[#9ECD1D] uppercase border border-[#9ECD1D]/20 px-3 py-1.5 rounded-xl hover:bg-[#9ECD1D] hover:text-black transition-all">
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
        <div className={`bg-zinc-900/40 border ${color} p-6 rounded-[2rem] flex items-center justify-between hover:scale-[1.02] transition-transform`}>
            <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                <p className={`text-2xl font-black italic tracking-tighter ${highlight ? "text-[#9ECD1D]" : "text-white"}`}>{value}</p>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 text-zinc-400">{icon}</div>
        </div>
    );
}