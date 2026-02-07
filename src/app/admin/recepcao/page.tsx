'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Smartphone, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function RecepcaoCheckinDefinitiva() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);
    const [statusCor, setStatusCor] = useState('zinc');
    const { isAdmin, loading: authLoading } = useAuth();

    // Carregamento de Modelos e Dados
    useEffect(() => {
        if (!authLoading && isAdmin) {
            const carregarRecursos = async () => {
                try {
                    setMensagem('Calibrando Sensores...');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    ]);

                    const { data } = await supabase.from('alunos')
                        .select('nome, email, face_descriptor')
                        .eq('status_assinatura', 'ativo');

                    setAlunosAtivos(data || []);
                    iniciarCamera();
                } catch (err) {
                    setMensagem('Erro de Inicialização');
                    setStatusCor('red');
                }
            };
            carregarRecursos();
        }
    }, [authLoading, isAdmin]);

    const iniciarCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setSistemaPronto(true);
                setMensagem('Aproxime o Rosto');
            }
        } catch (err) {
            setMensagem('Câmera Não Detectada');
            setStatusCor('red');
        }
    };

    const processarMovimentacao = useCallback(async (aluno: any) => {
        if (estaProcessando) return;
        setEstaProcessando(true);
        setStatusCor('yellow');
        setMensagem('Identificando...');

        try {
            const { data: ultimoRegistro } = await supabase
                .from('checkins')
                .select('tipo, data_hora')
                .eq('email', aluno.email)
                .order('data_hora', { ascending: false })
                .limit(1)
                .maybeSingle();

            const agora = new Date();
            const COOLDOWN_MINUTOS = 5;

            if (ultimoRegistro) {
                const dataUltimo = new Date(ultimoRegistro.data_hora);
                const diffMinutos = (agora.getTime() - dataUltimo.getTime()) / (1000 * 60);

                if (diffMinutos < COOLDOWN_MINUTOS) {
                    setMensagem(`Aguarde ${Math.ceil(COOLDOWN_MINUTOS - diffMinutos)}m`);
                    setStatusCor('zinc');
                    setTimeout(() => {
                        setEstaProcessando(false);
                        setMensagem('Aproxime o Rosto');
                    }, 3000);
                    return;
                }
            }

            const novoTipo = ultimoRegistro?.tipo === 'entrada' ? 'saida' : 'entrada';

            await supabase.from('checkins').insert([{
                email: aluno.email,
                aluno_nome: aluno.nome,
                tipo: novoTipo,
                data_hora: agora.toISOString()
            }]);

            setMensagem(`${novoTipo === 'entrada' ? 'BEM-VINDO' : 'ATÉ LOGO'}, ${aluno.nome.split(' ')[0]}!`);
            setStatusCor('green');

            setTimeout(() => {
                setEstaProcessando(false);
                setStatusCor('zinc');
                setMensagem('Aproxime o Rosto');
            }, 5000);

        } catch (err) {
            setMensagem('Erro de Conexão');
            setStatusCor('red');
            setEstaProcessando(false);
        }
    }, [estaProcessando]);

    useEffect(() => {
        if (!sistemaPronto || estaProcessando) return;
        const interval = setInterval(async () => {
            if (!videoRef.current || estaProcessando) return;
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                let melhorMatch = null;
                let menorDistancia = 0.45;
                for (const aluno of alunosAtivos) {
                    if (!aluno.face_descriptor) continue;
                    const descriptor = Array.isArray(aluno.face_descriptor) ? aluno.face_descriptor : Object.values(aluno.face_descriptor);
                    const dist = faceapi.euclideanDistance(detection.descriptor, new Float32Array(descriptor));
                    if (dist < menorDistancia) {
                        menorDistancia = dist;
                        melhorMatch = aluno;
                    }
                }
                if (melhorMatch) processarMovimentacao(melhorMatch);
            }
        }, 800);
        return () => clearInterval(interval);
    }, [sistemaPronto, estaProcessando, alunosAtivos, processarMovimentacao]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-x-hidden">

            {/* Header: Adaptável Mobile-First */}
            <header className="p-6 md:p-10 flex flex-col items-center gap-2 animate-in fade-in duration-700">
                <div className="flex items-center gap-2">
                    <UserCheck className="text-[#9ECD1D] w-6 h-6 md:w-8 md:h-8" />
                    <h1 className="text-3xl md:text-5xl font-smart-title italic uppercase tracking-tighter">
                        Smart<span className="text-[#9ECD1D]">Gate</span>
                    </h1>
                </div>
                <p className="text-[8px] md:text-[10px] font-smart-detail font-bold uppercase tracking-[0.3em] text-zinc-600">
                    Terminal de Acesso Biométrico
                </p>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 w-full max-w-4xl mx-auto">

                {/* Status Bar: Mobile-First (Largura Total -> Max Width) */}
                <div className={`w-full p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] mb-6 text-center transition-all duration-500 border-b-[6px] md:border-b-[10px] shadow-2xl ${statusCor === 'green' ? 'bg-emerald-600 border-emerald-900' :
                        statusCor === 'red' ? 'bg-red-600 border-red-900' :
                            statusCor === 'yellow' ? 'bg-yellow-500 text-black border-yellow-800' :
                                'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                    <span className="text-lg md:text-2xl font-smart-title italic uppercase block truncate">
                        {mensagem}
                    </span>
                </div>

                {/* Viewfinder: Ajuste de proporção para Mobile */}
                <div className="relative w-full aspect-[3/4] md:aspect-video rounded-3xl md:rounded-[3rem] overflow-hidden border-[6px] md:border-[12px] border-zinc-900 bg-black shadow-2xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover mirror"
                    />

                    {/* Overlay de Scanning Otimizado para Touch/Visualização */}
                    {sistemaPronto && !estaProcessando && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                            <div className="w-full max-w-[280px] aspect-square border-2 border-[#9ECD1D]/20 rounded-[3rem] md:rounded-[4rem] relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#9ECD1D] rounded-tl-2xl" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#9ECD1D] rounded-tr-2xl" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#9ECD1D] rounded-bl-2xl" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#9ECD1D] rounded-br-2xl" />
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#9ECD1D]/40 animate-scan shadow-[0_0_15px_#9ECD1D]" />
                            </div>
                        </div>
                    )}

                    {estaProcessando && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
                            <Loader2 className="w-12 h-12 text-[#9ECD1D] animate-spin" />
                            <p className="font-smart-detail text-[10px] uppercase tracking-widest text-[#9ECD1D]">Processando...</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer: Simplificado para telas pequenas */}
            <footer className="p-8 flex flex-wrap justify-center gap-6 md:gap-10 opacity-30 grayscale items-center text-zinc-400">
                <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-smart-detail font-bold uppercase tracking-widest">
                    <Smartphone size={14} /> Local Sync
                </div>
                <div className="hidden md:block h-4 w-px bg-zinc-800" />
                <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-smart-detail font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} /> Secure Bio
                </div>
            </footer>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
                @keyframes scan {
                    0%, 100% { top: 15%; opacity: 0.5; }
                    50% { top: 85%; opacity: 1; }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}