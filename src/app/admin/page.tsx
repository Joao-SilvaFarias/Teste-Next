"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Activity, TrendingUp, Loader2,
    MessageCircle, DollarSign, Clock, LogOut, Users,
    Search, FileDown, UserX, Info, Camera, AlertCircle,
    Bell, ChevronRight, CheckCircle2, HelpCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardSkeleton from '@/src/components/DashboardSkeleton';

// --- INTERFACES ---
interface Aluno {
    nome: string;
    email: string;
    status_assinatura: string;
    created_at: string;
    telefone?: string;
    role: string;
}

interface DadoGrafico {
    hora: string;
    visits: number;
}

interface AlunoPresente {
    aluno_nome: string;
    email: string;
    data_hora: string;
    tipo: string;
}

// --- MODAL DE CONFIRMAÇÃO PERSONALIZADO ---
function CustomConfirm({ isOpen, title, description, onConfirm, onCancel, type = 'info', loading }: any) {
    if (!isOpen) return null;

    const colors = {
        danger: "text-red-500 bg-red-500/10 border-red-500/20",
        success: "text-[#9ECD1D] bg-[#9ECD1D]/10 border-[#9ECD1D]/20",
        info: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    };

    const btnColors = {
        danger: "bg-red-600 hover:bg-red-500",
        success: "bg-[#9ECD1D] text-black hover:bg-[#b4e622]",
        info: "bg-zinc-100 text-black hover:bg-white"
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto border ${colors[type as keyof typeof colors]}`}>
                    {type === 'danger' && <AlertCircle size={32} />}
                    {type === 'success' && <CheckCircle2 size={32} />}
                    {type === 'info' && <HelpCircle size={32} />}
                </div>
                
                <h3 className="text-xl font-smart-title italic uppercase text-center mb-2 text-white">
                    {title}
                </h3>
                <p className="text-zinc-500 text-[10px] font-smart-detail text-center mb-8 uppercase tracking-widest leading-relaxed px-4">
                    {description}
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm} 
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-smart-detail uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${btnColors[type as keyof typeof btnColors]}`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirmar Ação"}
                    </button>
                    <button 
                        onClick={onCancel} 
                        disabled={loading}
                        className="w-full bg-zinc-800/50 py-4 rounded-2xl font-smart-detail text-zinc-400 uppercase text-[10px] hover:bg-zinc-800 transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE DE MÉTRICA ---
function MetricCard({ title, value, icon, highlight, description, alert }: any) {
    return (
        <div className={`bg-zinc-900/40 border ${alert ? 'border-red-500/20' : 'border-zinc-800/50'} p-6 rounded-[2.5rem] flex flex-col justify-between hover:bg-zinc-800/40 transition-all group relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <p className="text-zinc-500 text-[10px] font-smart-detail uppercase tracking-widest mb-1">{title}</p>
                    <p className={`text-2xl font-smart-title italic tracking-tighter ${highlight ? "text-[#9ECD1D]" : "text-white"}`}>
                        {value}
                    </p>
                </div>
                <div className={`p-3 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 ${highlight ? "text-[#9ECD1D]" : "text-zinc-500"}`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 border-t border-zinc-800/50 pt-3">
                {alert ? <AlertCircle size={10} className="text-red-500" /> : <Info size={10} className="text-zinc-700" />}
                <p className={`text-[9px] font-smart-detail uppercase tracking-tight ${alert ? "text-red-400" : "text-zinc-600"}`}>
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function DashboardContent() {
    const { isAdmin, loading: authLoading, user } = useAuth();
    const router = useRouter();

    // ESTADOS
    const [stats, setStats] = useState({ ativos: 0, total: 0, churnRate: '0' });
    const [dadosGrafico, setDadosGrafico] = useState<DadoGrafico[]>([]);
    const [alunosRecuperacao, setAlunosRecuperacao] = useState<Aluno[]>([]);
    const [alunosEmRisco, setAlunosEmRisco] = useState<Aluno[]>([]);
    const [presentes, setPresentes] = useState<AlunoPresente[]>([]);
    const [carregandoDados, setCarregandoDados] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [agoraParaTimer, setAgoraParaTimer] = useState(new Date());
    const [showModalEncerrar, setShowModalEncerrar] = useState(false);
    const [encerrando, setEncerrando] = useState(false);
    const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);

    // ESTADO DA CONFIRMAÇÃO PERSONALIZADA
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        type: 'danger' | 'success' | 'info';
        action: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info',
        action: () => {}
    });

    const pedirConfirmacao = (title: string, description: string, type: 'danger' | 'success' | 'info', action: () => void) => {
        setConfirmConfig({ isOpen: true, title, description, type, action });
    };

    const fecharConfirmacao = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    // --- AÇÕES COM CONFIRMAÇÃO ---

    const realizarCheckoutIndividual = (aluno: AlunoPresente) => {
        pedirConfirmacao(
            "Finalizar Treino?",
            `Deseja realizar o checkout manual de ${aluno.aluno_nome}?`,
            'danger',
            async () => {
                setProcessandoAcao(aluno.email);
                fecharConfirmacao();
                try {
                    const { error } = await supabase.from('checkins').delete().eq('email', aluno.email);
                    if (error) throw error;
                    setPresentes(prev => prev.filter(p => p.email !== aluno.email));
                } catch (error: any) {
                    alert("Erro ao realizar checkout: " + error.message);
                } finally {
                    setProcessandoAcao(null);
                }
            }
        );
    };

    const dispararCobranca = (aluno: Aluno) => {
        pedirConfirmacao(
            "Enviar Cobrança?",
            `Deseja enviar uma notificação para ${aluno.nome}?`,
            'success',
            () => {
                fecharConfirmacao();
                alert(`Solicitação enviada para ${aluno.email}`);
            }
        );
    };

    const gerarPDF = () => {
        pedirConfirmacao(
            "Exportar Dados?",
            "Deseja gerar e baixar o relatório de métricas em PDF?",
            'info',
            () => {
                fecharConfirmacao();
                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text("Relatório Command Center", 14, 20);
                autoTable(doc, {
                    startY: 30,
                    head: [['Métrica', 'Valor']],
                    body: [
                        ['Alunos Ativos', stats.ativos.toString()],
                        ['Receita Est.', `R$ ${(stats.ativos * 129).toLocaleString()}`],
                        ['Presentes', presentes.length.toString()],
                        ['Churn Rate', `${stats.churnRate}%`]
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [158, 205, 29] }
                });
                doc.save(`smartfit-report-${new Date().toLocaleDateString()}.pdf`);
            }
        );
    };

    // --- BUSCA E EFEITOS ---

    const buscarPresentes = useCallback(async () => {
        const { data, error } = await supabase.from('alunos_presentes').select('*');
        if (!error) setPresentes(data || []);
    }, []);

    const carregarDadosGerais = useCallback(async () => {
        try {
            const agora = new Date();
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(agora.getDate() - 7);
            const ontem = new Date();
            ontem.setHours(agora.getHours() - 24);

            const [alunosRes, checkinsRes, ultimosAcessos] = await Promise.all([
                supabase.from('alunos').select('*'),
                supabase.from('checkins').select('data_hora').gte('data_hora', ontem.toISOString()),
                supabase.from('checkins').select('email, data_hora').order('data_hora', { ascending: false })
            ]);

            if (alunosRes.data) {
                const lista: Aluno[] = alunosRes.data;
                const ativos = lista.filter(a => a.status_assinatura?.toLowerCase().trim() === 'ativo').length;

                setStats({
                    ativos,
                    total: lista.length,
                    churnRate: lista.length > 0 ? (((lista.length - ativos) / lista.length) * 100).toFixed(1) : '0'
                });
                setAlunosRecuperacao(lista.filter(a => a.status_assinatura?.toLowerCase().trim() !== 'ativo' && a.role !== "admin"));
                const emailsComAcessoRecente = new Set(ultimosAcessos.data?.filter(c => new Date(c.data_hora) > seteDiasAtras).map(c => c.email));
                setAlunosEmRisco(lista.filter(a => a.status_assinatura === 'ativo' && !emailsComAcessoRecente.has(a.email) && a.email !== user?.email).slice(0, 5));
            }

            const esqueleto: any[] = [];
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
            console.error("Erro dashboard:", error);
        } finally {
            setCarregandoDados(false);
        }
    }, [user?.email]);

    useEffect(() => {
        if (authLoading || !isAdmin) return;
        carregarDadosGerais();
        buscarPresentes();

        const canal = supabase
            .channel('dashboard-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
                buscarPresentes();
                carregarDadosGerais();
            })
            .subscribe();

        return () => { supabase.removeChannel(canal); };
    }, [authLoading, isAdmin, carregarDadosGerais, buscarPresentes]);

    useEffect(() => {
        const timer = setInterval(() => setAgoraParaTimer(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const confirmarEncerrarDia = async () => {
        setEncerrando(true);
        try {
            const { error } = await supabase.rpc('realizar_auto_checkout');
            if (error) throw error;
            setPresentes([]);
            setShowModalEncerrar(false);
        } catch (error: any) {
            alert("Erro: " + error.message);
        } finally {
            setEncerrando(false);
        }
    };

    const horarioPico = useMemo(() => {
        if (dadosGrafico.length === 0) return "--:--";
        const maior = [...dadosGrafico].sort((a: any, b: any) => b.visitas - a.visitas)[0];
        return maior?.visits > 0 ? maior.hora : "--:--";
    }, [dadosGrafico]);

    const lotacaoPercentual = useMemo(() => {
        const limite = 50;
        return Math.min(Math.round((presentes.length / limite) * 100), 100);
    }, [presentes]);

    if (authLoading || carregandoDados) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 font-sans selection:bg-[#9ECD1D] selection:text-black">
            
            {/* COMPONENTE DE CONFIRMAÇÃO GLOBAL */}
            <CustomConfirm 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                description={confirmConfig.description}
                type={confirmConfig.type}
                onConfirm={confirmConfig.action}
                onCancel={fecharConfirmacao}
                loading={processandoAcao !== null}
            />

            {/* BOTÃO FLUTUANTE SCANNER */}
            <button
                onClick={() => router.push('/admin/recepcao')}
                className="fixed bottom-8 right-8 z-[90] w-20 h-20 bg-[#9ECD1D] text-black rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(158,205,29,0.2)] hover:scale-105 active:scale-95 transition-all group border-4 border-zinc-950"
            >
                <Camera size={32} />
            </button>

            {/* MODAL ENCERRAMENTO */}
            {showModalEncerrar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-10 rounded-[3rem] shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <LogOut size={40} />
                        </div>
                        <h2 className="text-3xl font-smart-title italic uppercase text-center mb-2 leading-none">
                            Encerrar <span className="text-red-500">Dia?</span>
                        </h2>
                        <p className="text-zinc-500 text-xs font-smart-detail text-center mb-10 uppercase tracking-widest">Todos os check-ins serão finalizados agora.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmarEncerrarDia} disabled={encerrando} className="w-full bg-red-600 hover:bg-red-500 py-5 rounded-2xl font-smart-detail uppercase text-[10px] flex items-center justify-center gap-2 transition-all">
                                {encerrando ? <Loader2 className="animate-spin" size={16} /> : "Finalizar Expediente"}
                            </button>
                            <button onClick={() => setShowModalEncerrar(false)} className="w-full bg-zinc-800 py-5 rounded-2xl font-smart-detail text-zinc-400 uppercase text-[10px]">Voltar ao Painel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER COM STATUS LIVE */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                            <span className="w-2 h-2 bg-[#9ECD1D] rounded-full animate-pulse shadow-[0_0_10px_#9ECD1D]" />
                            <span className="text-[9px] font-smart-detail text-zinc-400 uppercase tracking-widest">Unidade Live</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-smart-title italic uppercase tracking-tighter">
                        Command <span className="text-[#9ECD1D]">Center</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={gerarPDF} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-6 py-3.5 rounded-2xl font-smart-detail text-[10px] uppercase hover:bg-zinc-800 transition-all text-zinc-400">
                        <FileDown size={16} /> Exportar Dados
                    </button>
                    <button onClick={() => setShowModalEncerrar(true)} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-6 py-3.5 rounded-2xl font-smart-detail text-[10px] uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <LogOut size={16} /> Encerrar
                    </button>
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <input
                            type="text" placeholder="PESQUISAR PAINEL..."
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-14 pr-6 text-[10px] font-smart-detail focus:border-[#9ECD1D] outline-none w-64 transition-all focus:w-80 placeholder:text-zinc-800"
                            value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* MÉTRICAS PRINCIPAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <MetricCard title="Receita Projetada" value={`R$ ${(stats.ativos * 129).toLocaleString()}`} icon={<DollarSign size={20} />} highlight description="MENSALIDADES ATIVAS" />
                <MetricCard title="Atletas Ativos" value={stats.ativos} icon={<Users size={20} />} description="TOTAL DE MATRÍCULAS" />
                <MetricCard title="Pico de Acesso" value={horarioPico} icon={<Clock size={20} />} description="MÉDIA DAS ÚLTIMAS 24H" />
                <MetricCard title="Evasão (Churn)" value={`${stats.churnRate}%`} icon={<TrendingUp size={20} />} alert={Number(stats.churnRate) > 15} description="TAXA DE DESISTÊNCIA" />
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">

                    {/* GRÁFICO */}
                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[3rem]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-smart-detail uppercase tracking-widest flex items-center gap-2 text-zinc-400">
                                <Activity size={16} className="text-[#9ECD1D]" /> Fluxo de Atletas
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-smart-detail text-zinc-600">
                                <span className="w-2 h-2 bg-[#9ECD1D] rounded-full" /> HOJE
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadosGrafico}>
                                    <defs>
                                        <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9ECD1D" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#9ECD1D" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="hora" stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '10px', fontFamily: 'Inter' }} />
                                    <Area type="monotone" dataKey="visitas" stroke="#9ECD1D" strokeWidth={3} fill="url(#colorVis)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* LISTA DE PRESENTES */}
                    <section>
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-lg font-smart-title uppercase italic text-white tracking-tight">
                                No Shape <span className="text-[#9ECD1D]">Agora</span>
                            </h2>
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] font-smart-detail text-zinc-500">{presentes.length} ATLETAS</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${lotacaoPercentual > 80 ? 'bg-red-500' : 'bg-[#9ECD1D]'}`} />)}
                                </div>
                            </div>
                        </div>

                        {presentes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {presentes.filter(a => a.aluno_nome.toLowerCase().includes(termoPesquisa.toLowerCase())).map((aluno) => {
                                    const tempo = Math.floor((agoraParaTimer.getTime() - new Date(aluno.data_hora).getTime()) / 60000);
                                    return (
                                        <div key={aluno.email} className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-[2rem] flex items-center justify-between group hover:border-[#9ECD1D]/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-[#9ECD1D] font-smart-title italic border border-white/5 uppercase">
                                                    {aluno.aluno_nome[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-smart-title uppercase italic leading-none mb-1">{aluno.aluno_nome}</p>
                                                    <p className={`text-[9px] font-smart-detail uppercase tracking-tight ${tempo > 90 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                        {tempo > 120 ? "⚠️ TREINO LONGO (+2H)" : `Há ${tempo} min na unidade`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                className={`p-3 transition-colors ${processandoAcao === aluno.email ? 'text-zinc-500' : 'text-zinc-800 hover:text-red-500'}`} 
                                                onClick={() => realizarCheckoutIndividual(aluno)}
                                                disabled={processandoAcao === aluno.email}
                                            >
                                                {processandoAcao === aluno.email ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-24 border-2 border-dashed border-zinc-900 rounded-[3rem] flex flex-col items-center justify-center text-zinc-800">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p className="text-[10px] font-smart-detail uppercase tracking-[0.2em]">Nenhum atleta detectado</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* SIDEBAR DE RISCOS */}
                <div className="space-y-8">
                    {/* CAPACIDADE */}
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl">
                        <div className="flex justify-between items-end mb-6">
                            <h3 className="text-[10px] font-smart-detail uppercase tracking-widest text-zinc-500">Lotação da Unidade</h3>
                            <span className="text-2xl font-smart-title italic text-white">{lotacaoPercentual}%</span>
                        </div>
                        <div className="h-3 bg-black rounded-full overflow-hidden p-1 border border-zinc-800">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${lotacaoPercentual > 80 ? 'bg-red-500' : 'bg-[#9ECD1D]'}`}
                                style={{ width: `${lotacaoPercentual}%` }}
                            />
                        </div>
                    </div>

                    {/* ABANDONO */}
                    <section className="bg-red-500/5 border border-red-500/10 p-8 rounded-[3rem]">
                        <h3 className="text-[10px] font-smart-detail uppercase tracking-widest text-red-500 mb-8 flex items-center gap-3">
                            <UserX size={18} /> Risco de Abandono
                        </h3>
                        <div className="space-y-4">
                            {alunosEmRisco.map((aluno, i) => (
                                <div key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl group border border-transparent hover:border-red-500/20 transition-all">
                                    <div>
                                        <p className="text-xs font-smart-title uppercase italic">{aluno.nome.split(' ')[0]}</p>
                                        <p className="text-[9px] font-smart-detail text-zinc-600 uppercase">+7 DIAS AUSENTE</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            pedirConfirmacao(
                                                "Resgate de Atleta",
                                                `Deseja iniciar contato de retenção com ${aluno.nome}?`,
                                                'info',
                                                () => { fecharConfirmacao(); alert("Chat iniciado!"); }
                                            );
                                        }}
                                        className="p-3 bg-white text-black rounded-xl hover:bg-[#9ECD1D] transition-all"
                                    >
                                        <MessageCircle size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* RECUPERAÇÃO */}
                    <section className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[3rem]">
                        <h3 className="text-[10px] font-smart-detail uppercase tracking-widest text-[#9ECD1D] mb-8 flex items-center gap-3">
                            <Bell size={18} /> Pendências Financeiras
                        </h3>
                        <div className="space-y-6">
                            {alunosRecuperacao.slice(0, 4).map((aluno, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0">
                                    <div className="max-w-[140px]">
                                        <p className="text-xs font-smart-title uppercase italic truncate">{aluno.nome}</p>
                                        <p className="text-[9px] text-red-500 font-smart-detail uppercase">{aluno.status_assinatura}</p>
                                    </div>
                                    <button 
                                        onClick={() => dispararCobranca(aluno)}
                                        className="group flex items-center gap-2 text-[9px] font-smart-detail text-[#9ECD1D] uppercase tracking-widest hover:translate-x-1 transition-all"
                                    >
                                        COBRAR <ChevronRight size={12} />
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