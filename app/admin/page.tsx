'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Users, CheckCircle, XCircle, Activity, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/src/hooks/useAdmin';

export default function AdminDashboard() {
    const { loading } = useAdmin();
    const [stats, setStats] = useState({ ativos: 0, pendentes: 0, total: 0 });
    const [ultimosCheckins, setUltimosCheckins] = useState<any[]>([]);
    const [buscando, setBuscando] = useState(false);

    async function carregarDados() {
        setBuscando(true);
        try {
            // Busca Alunos
            const { data: alunos, error: errAlunos } = await supabase
                .from('alunos')
                .select('status_assinatura');
            
            if (errAlunos) console.error("Erro alunos:", errAlunos);

            // Busca Checkins
            const { data: checkins, error: errCheckins } = await supabase
                .from('checkins')
                .select('*')
                .order('data_hora', { ascending: false })
                .limit(10);
            
            if (errCheckins) console.error("Erro checkins:", errCheckins);

            if (alunos) {
                setStats({
                    ativos: alunos.filter(a => a.status_assinatura === 'active').length,
                    pendentes: alunos.filter(a => a.status_assinatura !== 'active').length,
                    total: alunos.length
                });
            }
            setUltimosCheckins(checkins || []);
        } finally {
            setBuscando(false);
        }
    }

    useEffect(() => {
        if (!loading) carregarDados();
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-yellow-400 font-bold animate-pulse uppercase tracking-widest">Verificando Credenciais...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
            <header className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter italic">ADMIN DASHBOARD</h1>
                    <p className="text-zinc-500 font-medium">Controle operacional e financeiro.</p>
                </div>
                <button 
                    onClick={carregarDados}
                    disabled={buscando}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all text-yellow-400 disabled:opacity-50"
                >
                    <RefreshCcw className={`w-6 h-6 ${buscando ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <MetricCard title="Alunos Ativos" value={stats.ativos} icon={<CheckCircle className="text-green-400" />} color="border-green-500/20" />
                <MetricCard title="Pendentes/Cancelados" value={stats.pendentes} icon={<XCircle className="text-red-400" />} color="border-red-500/20" />
                <MetricCard title="Total de Cadastros" value={stats.total} icon={<Users className="text-blue-400" />} color="border-blue-500/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ÚLTIMOS ACESSOS */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="text-yellow-400" />
                        <h2 className="text-xl font-bold">Fluxo da Recepção</h2>
                    </div>
                    <div className="space-y-4">
                        {ultimosCheckins.map((c) => (
                            <div key={c.id} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
                                <span className="font-bold text-zinc-200 uppercase tracking-tight">{c.aluno_nome}</span>
                                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">
                                    {new Date(c.data_hora).toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                        ))}
                        {ultimosCheckins.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-2xl">
                                <p className="text-zinc-600 italic">Nenhum check-in registrado.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* DICA DE NEGÓCIO */}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 text-black flex flex-col justify-between shadow-[0_20px_50px_rgba(234,179,8,0.15)]">
                    <div>
                        <h2 className="text-2xl font-black mb-2 leading-tight uppercase italic">Faturamento Estimado</h2>
                        <p className="font-bold opacity-70 text-sm">Baseado em alunos ativos:</p>
                        <p className="text-6xl font-black mt-4 tracking-tighter">
                            <span className="text-2xl mr-1">R$</span>
                            {(stats.ativos * 129).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
                            <div className="h-full bg-black" style={{ width: `${(stats.ativos / (stats.total || 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-xs font-bold uppercase opacity-60">Taxa de Conversão: {Math.round((stats.ativos / (stats.total || 1)) * 100)}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }: any) {
    return (
        <div className={`bg-zinc-900/50 border ${color} p-8 rounded-3xl backdrop-blur-sm transition-transform hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/50 rounded-2xl shadow-inner">{icon}</div>
                <span className="text-5xl font-black tracking-tighter">{value}</span>
            </div>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">{title}</p>
        </div>
    );
}