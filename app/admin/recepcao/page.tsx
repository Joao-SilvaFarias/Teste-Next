'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext'; 
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecepcaoCheckin() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();
    
    const { isAdmin, loading: authLoading } = useAuth();
    
    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);

    // 1. Efeito de Proteção e Redirecionamento
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/'); // Redireciona imediatamente sem deixar rastro no histórico
        }
    }, [authLoading, isAdmin, router]);

    // 2. Carregamento de Dados (Só executa se for Admin verificado)
    useEffect(() => {
        if (!authLoading && isAdmin) {
            async function prepararRecepcao() {
                try {
                    setMensagem('Carregando IA...');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                    ]);

                    setMensagem('Sincronizando base...');
                    const { data, error } = await supabase
                        .from('alunos')
                        .select('nome, face_descriptor')
                        .eq('status_assinatura', 'ativo')
                        .not('face_descriptor', 'is', null);

                    if (error) throw error;
                    setAlunosAtivos(data || []);

                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { width: 640, height: 480 } 
                    });
                    
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setSistemaPronto(true);
                    setMensagem('Aguardando rosto...');
                } catch (err) {
                    setMensagem('❌ Erro de Inicialização');
                }
            }
            prepararRecepcao();
        }
    }, [authLoading, isAdmin]);

    // 3. Lógica de Reconhecimento Facial
    useEffect(() => {
        if (!sistemaPronto || estaProcessando || !isAdmin) return;

        const interval = setInterval(async () => {
            if (!videoRef.current) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                let melhorMatch = null;
                let menorDistancia = 0.45; 

                for (const aluno of alunosAtivos) {
                    const rawDescriptor = Array.isArray(aluno.face_descriptor)
                        ? aluno.face_descriptor
                        : Object.values(aluno.face_descriptor);

                    const distancia = faceapi.euclideanDistance(
                        detection.descriptor,
                        new Float32Array(rawDescriptor)
                    );

                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        melhorMatch = aluno.nome;
                    }
                }

                if (melhorMatch) {
                    setEstaProcessando(true);
                    setMensagem(`✅ BEM-VINDO: ${melhorMatch.toUpperCase()}`);
                    
                    await supabase.from('checkins').insert([{
                        aluno_nome: melhorMatch,
                        data_hora: new Date().toISOString()
                    }]);

                    setTimeout(() => {
                        setMensagem('Aguardando rosto...');
                        setEstaProcessando(false);
                    }, 4000);
                } else {
                    setMensagem('❌ ACESSO NEGADO: NÃO ATIVO');
                    setTimeout(() => !estaProcessando && setMensagem('Aguardando rosto...'), 2000);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [alunosAtivos, estaProcessando, sistemaPronto, isAdmin]);

    // Enquanto checa se é admin ou não, mostra apenas o loader centralizado
    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#9ECD1D] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-black text-[#9ECD1D] italic tracking-tighter uppercase">Smart Reception</h1>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Terminal de Acesso</p>
            </header>

            <div className={`w-full max-w-md p-6 rounded-2xl mb-8 text-center text-xl font-black border-4 transition-all duration-300 ${
                mensagem.includes('✅') ? 'bg-green-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                mensagem.includes('❌') ? 'bg-red-600 border-red-400 animate-shake' :
                'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
                {mensagem}
            </div>

            <div className="relative rounded-[3rem] overflow-hidden border-8 border-zinc-900 shadow-2xl bg-black aspect-video max-w-2xl w-full">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                
                {sistemaPronto && !estaProcessando && (
                    <div className="absolute inset-0 pointer-events-none">
                         <div className="w-full h-1 bg-[#9ECD1D] shadow-[0_0_20px_#9ECD1D] absolute animate-scan" />
                         <div className="absolute inset-0 border-[60px] border-black/20" />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-scan { animation: scan 3s linear infinite; }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
}