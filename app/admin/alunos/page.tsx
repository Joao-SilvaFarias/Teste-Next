'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { User, Trash2, ShieldCheck, Mail } from 'lucide-react';

export default function ListaAlunos() {
    const { loading } = useAdmin();
    const [alunos, setAlunos] = useState<any[]>([]);

    async function buscarAlunos() {
        const { data } = await supabase
            .from('alunos')
            .select('*')
            .order('nome', { ascending: true });
        setAlunos(data || []);
    }

    useEffect(() => {
        if (!loading) buscarAlunos();
    }, [loading]);

    async function excluirAluno(id: string) {
        if (confirm('Tem certeza que deseja excluir este aluno?')) {
            await supabase.from('alunos').delete().eq('id', id);
            buscarAlunos();
        }
    }

    if (loading) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 pb-32">
            <header className="mb-10">
                <h1 className="text-3xl font-black italic">GESTÃO DE ALUNOS</h1>
                <p className="text-zinc-500">Visualize e gerencie os membros da academia.</p>
            </header>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-widest">
                            <th className="px-6 py-4 font-black">Aluno</th>
                            <th className="px-6 py-4 font-black">Status</th>
                            <th className="px-6 py-4 font-black text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {alunos.map((aluno) => (
                            <tr key={aluno.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-yellow-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-200 uppercase">{aluno.nome}</p>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Mail size={12} /> {aluno.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                        aluno.status_assinatura === 'active' 
                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                        {aluno.status_assinatura || 'Pendente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => excluirAluno(aluno.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {alunos.length === 0 && (
                    <div className="p-20 text-center text-zinc-600 italic">
                        Nenhum aluno cadastrado no banco de dados.
                    </div>
                )}
            </div>
        </div>
    );
}