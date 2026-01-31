'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { Users, CheckCircle, XCircle, Activity, TrendingUp } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

// 1. Interfaces para Tipagem Segura
interface DadoGrafico {
    hora: string;
    visitas: number;
}

interface Stats {
    ativos: number;
    pendentes: number;
    total: number;
}

export default function AdminDashboard() {
    const { loading } = useAdmin();
    const [stats, setStats] = useState<Stats>({ ativos: 0, pendentes: 0, total: 0 });
    const [dadosGrafico, setDadosGrafico] = useState<DadoGrafico[]>([]);
    const [carregandoDados, setCarregandoDados] = useState(true);

    // 2. Função de carregamento refatorada e memoizada
    const carregarDados = useCallback(async () => {
        try {
            setCarregandoDados(true);

            // Busca Alunos e Check-ins em paralelo para ganhar velocidade
            const ontem = new Date();
            ontem.setHours(ontem.getHours() - 24);

            const [alunosRes, checkinsRes] = await Promise.all([
                supabase.from('alunos').select('status_assinatura'),
                supabase.from('checkins')
                    .select('data_hora')
                    .gte('data_hora', ontem.toISOString())
            ]);

            // Processar Estatísticas
            if (alunosRes.data) {
                const ativos = alunosRes.data.filter(a => a.status_assinatura === 'ativo').length;
                setStats({
                    ativos,
                    pendentes: alunosRes.data.length - ativos,
                    total: alunosRes.data.length
                });
            }

            // Processar Gráfico (Esqueleto de 12h)
            const agora = new Date();
            const esqueleto: DadoGrafico[] = [];
            
            for (let i = 12; i >= 0; i--) {
                const d = new Date();
                d.setHours(agora.getHours() - i);
                esqueleto.push({ hora: `${d.getHours()}:00`, visitas: 0 });
            }

            if (checkinsRes.data) {
                checkinsRes.data.forEach(c => {
                    const horaCheckin = `${new Date(c.data_hora).getHours()}:00`;
                    const ponto = esqueleto.find(h => h.hora === horaCheckin);
                    if (ponto) ponto.visitas += 1;
                });
            }

            setDadosGrafico(esqueleto);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setCarregandoDados(false);
        }
    }, []);

    useEffect(() => {
        if (!loading) carregarDados();
    }, [loading, carregarDados]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32">
            <header className="mb-10">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">Estatísticas</h1>
                <p className="text-zinc-500 font-medium italic">Monitoramento de fluxo e conversão.</p>
            </header>

            {/* GRÁFICO DE MOVIMENTO */}
            <section className="bg-zinc-900/40 border border-zinc-800/50 p-6 md:p-8 rounded-[2rem] mb-8 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp className="text-green-400" size={20} />
                        </div>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-300">Fluxo de Alunos (12h)</h2>
                    </div>
                    {carregandoDados && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />}
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dadosGrafico}>
                            <defs>
                                <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="hora"
                                stroke="#52525b"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '12px' }}
                                cursor={{ stroke: '#facc15', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />
                            <Area
                                dataKey="visitas"
                                stroke="#facc15"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorVisitas)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Alunos Ativos" 
                    value={stats.ativos} 
                    icon={<CheckCircle size={24} className="text-green-500" />} 
                    color="border-green-500/20"
                />
                <MetricCard 
                    title="Pendentes/Inativos" 
                    value={stats.pendentes} 
                    icon={<XCircle size={24} className="text-red-500" />} 
                    color="border-red-500/20"
                />
                <MetricCard 
                    title="Receita Estimada" 
                    value={`R$ ${(stats.ativos * 129).toLocaleString()}`} 
                    icon={<Activity size={24} className="text-yellow-500" />} 
                    color="border-yellow-500/20"
                />
            </div>
        </div>
    );
}

// 3. Sub-componente extraído para limpeza
function MetricCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className={`bg-zinc-900/40 border ${color} p-6 rounded-[1.5rem] flex items-center justify-between hover:bg-zinc-900/60 transition-colors`}>
            <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
                <p className="text-3xl font-black italic tracking-tighter">{value}</p>
            </div>
            <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">{icon}</div>
        </div>
    );
}