'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext'; // 1. Trocando o hook antigo pelo Contexto
import { useRouter } from 'next/navigation';
import { User, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ListaAlunos() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [alunos, setAlunos] = useState<any[]>([]);
    const [alunoParaExcluir, setAlunoParaExcluir] = useState<any>(null);
    const [processandoId, setProcessandoId] = useState<string | null>(null);
    const [buscandoDados, setBuscandoDados] = useState(false);

    // Proteção de Rota
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    // Busca de alunos memoizada
    const buscarAlunos = useCallback(async () => {
        setBuscandoDados(true);
        const { data } = await supabase
            .from('alunos')
            .select('*')
            .order('nome', { ascending: true });
        setAlunos(data || []);
        setBuscandoDados(false);
    }, []);

    // 2. Só dispara a busca quando o Auth confirmar que é admin
    useEffect(() => {
        if (!authLoading && isAdmin) {
            buscarAlunos();
        }
    }, [authLoading, isAdmin, buscarAlunos]);

    async function ativarManual(id: string) {
        setProcessandoId(id);
        const { error } = await supabase
            .from('alunos')
            .update({ status_assinatura: 'ativo' })
            .eq('id', id);
        
        if (!error) await buscarAlunos();
        setProcessandoId(null);
    }

    async function confirmarExclusao() {
        if (!alunoParaExcluir) return;
        const { error } = await supabase.from('alunos').delete().eq('id', alunoParaExcluir.id);
        if (!error) {
            setAlunos(alunos.filter(a => a.id !== alunoParaExcluir.id));
            setAlunoParaExcluir(null);
        }
    }

    // Loader de tela cheia para verificação de permissão
    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#9ECD1D] animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">Gestão de Membros</h1>
                    <p className="text-zinc-500 font-medium">Administre os acessos e perfis da unidade.</p>
                </div>
                {buscandoDados && <Loader2 className="animate-spin text-[#9ECD1D] mb-2" size={20} />}
            </header>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/30 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-6 py-5">Identificação</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {alunos.map((aluno) => (
                                <tr key={aluno.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-zinc-800 rounded-2xl flex items-center justify-center text-[#9ECD1D] group-hover:scale-110 transition-transform shadow-inner">
                                                <User size={22} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-100 uppercase text-sm tracking-tight">{aluno.nome}</p>
                                                <p className="text-xs text-zinc-500 font-mono">{aluno.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                                            aluno.status_assinatura === 'ativo' 
                                            ? 'bg-[#9ECD1D]/5 text-[#9ECD1D] border-[#9ECD1D]/20' 
                                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                        }`}>
                                            {aluno.status_assinatura || 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {aluno.status_assinatura !== 'ativo' && (
                                                <button 
                                                    onClick={() => ativarManual(aluno.id)}
                                                    disabled={processandoId === aluno.id}
                                                    className="p-3 text-zinc-500 hover:text-[#9ECD1D] hover:bg-[#9ECD1D]/5 rounded-xl transition-all disabled:opacity-30"
                                                >
                                                    {processandoId === aluno.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setAlunoParaExcluir(aluno)}
                                                className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE EXCLUSÃO */}
            {alunoParaExcluir && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-black text-white mb-2 uppercase italic">Confirmar Exclusão?</h2>
                            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                                O aluno <span className="text-white font-bold">{alunoParaExcluir.nome}</span> perderá acesso imediato.
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <button onClick={confirmarExclusao} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-colors">Excluir Agora</button>
                                <button onClick={() => setAlunoParaExcluir(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-2xl uppercase tracking-widest text-xs transition-colors">Manter Aluno</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}