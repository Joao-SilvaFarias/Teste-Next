'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Camera, Smartphone, ShieldCheck, ArrowLeftRight, UserCheck } from 'lucide-react';

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
                    setMensagem('Erro Crítico de Inicialização');
                    setStatusCor('red');
                }
            };
            carregarRecursos();
        }
    }, [authLoading, isAdmin]);

    const iniciarCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', aspectRatio: { ideal: 1.777778 } }
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

    // Lógica de Movimentação (Check-in / Out)
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
                    const resta = Math.ceil((COOLDOWN_MINUTOS - diffMinutos) * 60);
                    setMensagem(`Aguarde ${resta}s para novo acesso`);
                    setStatusCor('zinc');
                    new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3').play().catch(() => {});
                    
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

            const greeting = novoTipo === 'entrada' ? 'BEM-VINDO' : 'ATÉ LOGO';
            setMensagem(`${greeting}, ${aluno.nome.split(' ')[0]}!`);
            setStatusCor('green');

            const sound = novoTipo === 'entrada' 
                ? 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' 
                : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
            new Audio(sound).play().catch(() => {});

            setTimeout(() => {
                setEstaProcessando(false);
                setStatusCor('zinc');
                setMensagem('Aproxime o Rosto');
            }, 5000);

        } catch (err) {
            setMensagem('Erro na Sincronização');
            setStatusCor('red');
            setEstaProcessando(false);
        }
    }, [estaProcessando]);

    // Loop de Reconhecimento
    useEffect(() => {
        if (!sistemaPronto || estaProcessando) return;

        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || estaProcessando) return;

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
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            {/* Header de Identidade */}
            <header className="mb-10 text-center animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <UserCheck className="text-[#9ECD1D]" size={28} />
                    <h1 className="text-4xl font-smart-title italic tracking-tighter uppercase">
                        Smart<span className="text-[#9ECD1D]">Gate</span>
                    </h1>
                </div>
                <p className="text-[10px] font-smart-detail font-bold uppercase tracking-[0.4em] text-zinc-600">Bio-Authentication Terminal</p>
            </header>

            {/* Display de Status Dinâmico */}
            <div className={`w-full max-w-xl p-8 rounded-[2.5rem] mb-8 text-center transition-all duration-500 border-b-[10px] shadow-2xl ${
                statusCor === 'green' ? 'bg-emerald-600 border-emerald-900' :
                statusCor === 'red' ? 'bg-red-600 border-red-900' :
                statusCor === 'yellow' ? 'bg-yellow-500 text-black border-yellow-800' :
                'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
                <span className="text-2xl font-smart-title italic uppercase tracking-tighter block truncate">
                    {mensagem}
                </span>
            </div>

            {/* Viewfinder da Câmera */}
            <div className="relative w-full max-w-2xl aspect-video rounded-[3rem] overflow-hidden border-[12px] border-zinc-900 bg-black shadow-2xl group">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover mirror"
                />

                {/* Overlay de Scanning */}
                {sistemaPronto && !estaProcessando && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-[#9ECD1D]/20 rounded-[4rem] relative">
                            {/* Cantos Estilizados */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#9ECD1D] rounded-tl-3xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#9ECD1D] rounded-tr-3xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#9ECD1D] rounded-bl-3xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#9ECD1D] rounded-br-3xl" />
                            
                            <div className="absolute inset-0 bg-[#9ECD1D]/5 animate-pulse rounded-[4rem]" />
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#9ECD1D]/30 animate-scan shadow-[0_0_15px_#9ECD1D]" />
                        </div>
                    </div>
                )}

                {estaProcessando && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <Loader2 className="w-16 h-16 text-[#9ECD1D] animate-spin" />
                    </div>
                )}
            </div>

            {/* Footer de Compliance */}
            <footer className="mt-12 flex gap-10 opacity-20 grayscale items-center text-zinc-400">
                <div className="flex items-center gap-2 text-[9px] font-smart-detail font-bold uppercase tracking-widest">
                    <Smartphone size={14} /> Auto-Sync Active
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="flex items-center gap-2 text-[9px] font-smart-detail font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} /> Neural Processing
                </div>
            </footer>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
                @keyframes scan {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}