'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Activity, Wifi, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecepcaoCheckinDefinitiva() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mensagem, setMensagem] = useState('SISTEMA_OFFLINE');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);
    const [statusCor, setStatusCor] = useState('zinc');
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Se o carregamento da autenticação terminou e o usuário não é admin
        if (!authLoading && !isAdmin) {
            router.replace('/'); // Expulsa para a home
        }
    }, [authLoading, isAdmin, router]);

    if (authLoading || !isAdmin) return null; // Mata o esqueleto aqui também por garantia

    // SETUP NÚCLEO BXVS
    useEffect(() => {
        if (!authLoading && isAdmin) {
            const carregarRecursos = async () => {
                try {
                    setMensagem('CALIBRANDO_SENSORES');
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
                    setMensagem('ERRO_CRITICO_SISTEMA');
                    setStatusCor('red');
                }
            };
            carregarRecursos();
        }

        // Cleanup: Desliga a câmera ao sair da página
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [authLoading, isAdmin]);

    const iniciarCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setSistemaPronto(true);
                setMensagem('AGUARDANDO_SCAN');
            }
        } catch (err) {
            setMensagem('ERRO_CAMERA_NULL');
            setStatusCor('red');
        }
    };

    const processarMovimentacao = useCallback(async (aluno: any) => {
        if (estaProcessando) return;
        setEstaProcessando(true);
        setStatusCor('yellow');
        setMensagem('ANALISANDO_BIOMETRIA...');

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
                    setMensagem(`INTERVALO_ATIVO: ${Math.ceil(COOLDOWN_MINUTOS - diffMinutos)}MIN`);
                    setStatusCor('zinc');
                    setTimeout(() => {
                        setEstaProcessando(false);
                        setMensagem('AGUARDANDO_SCAN');
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

            const primeiroNome = aluno.nome.split(' ')[0].toUpperCase();
            setMensagem(novoTipo === 'entrada' ? `BEM-VINDO_${primeiroNome}` : `ATÉ_LOGO_${primeiroNome}`);
            setStatusCor('green');

            setTimeout(() => {
                setEstaProcessando(false);
                setStatusCor('zinc');
                setMensagem('AGUARDANDO_SCAN');
            }, 4000);

        } catch (err) {
            setMensagem('ERRO_SINC_BANCO');
            setStatusCor('red');
            setEstaProcessando(false);
        }
    }, [estaProcessando]);

    useEffect(() => {
        if (!sistemaPronto || estaProcessando || alunosAtivos.length === 0) return;

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
                    const descriptor = Array.isArray(aluno.face_descriptor)
                        ? aluno.face_descriptor
                        : Object.values(aluno.face_descriptor);

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
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden selection:bg-[#9ECD1D]">

            <header className="p-6 md:p-8 flex flex-col items-center gap-1 border-b border-white/5 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#9ECD1D] rounded-full animate-ping" />
                    <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
                        GATE<span className="text-[#9ECD1D]">_STATION</span>
                    </h1>
                </div>
                <div className="flex gap-4 mt-2">
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-1">
                        <Wifi size={10} className="text-[#9ECD1D]" /> SINCRONIA_LIVE
                    </span>
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-1">
                        <Cpu size={10} className="text-[#9ECD1D]" /> MOTOR_IA_V3
                    </span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto gap-4">

                {/* DISPLAY DE MENSAGEM PRINCIPAL */}
                <div className={`w-full py-8 md:py-12 rounded-[2rem] text-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 ${statusCor === 'green' ? 'bg-[#9ECD1D] text-black scale-105' :
                        statusCor === 'red' ? 'bg-red-600 text-white' :
                            statusCor === 'yellow' ? 'bg-white text-black' :
                                'bg-[#0a0a0a] text-zinc-500 border border-white/5'
                    }`}>
                    <span className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter block px-4 leading-none">
                        {mensagem}
                    </span>
                </div>

                {/* ÁREA DO VÍDEO */}
                <div className="relative w-full aspect-[4/5] md:aspect-video rounded-[2.5rem] overflow-hidden border-4 border-[#0a0a0a] bg-black shadow-2xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover mirror opacity-80"
                    />

                    {/* OVERLAY DE SCANNER */}
                    {sistemaPronto && !estaProcessando && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[80%] h-[70%] border border-[#9ECD1D]/10 relative">
                                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-[#9ECD1D]" />
                                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-[#9ECD1D]" />
                                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-[#9ECD1D]" />
                                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-[#9ECD1D]" />

                                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#9ECD1D] shadow-[0_0_20px_#9ECD1D] animate-scan opacity-50" />
                            </div>

                            <div className="absolute w-48 h-48 border border-white/5 rounded-full animate-pulse flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#9ECD1D] rounded-full shadow-[0_0_10px_#9ECD1D]" />
                            </div>
                        </div>
                    )}

                    {/* OVERLAY DE CARREGAMENTO */}
                    {estaProcessando && (
                        <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center z-20 gap-6">
                            <div className="relative">
                                <Activity className="w-16 h-16 text-[#9ECD1D] animate-pulse" />
                                <Loader2 className="absolute -inset-4 w-24 h-24 text-white/10 animate-spin" />
                            </div>
                            <p className="font-black text-xs uppercase tracking-[0.5em] text-[#9ECD1D] animate-bounce">
                                Autenticando...
                            </p>
                        </div>
                    )}
                </div>

                {/* MÉTRICAS INFERIORES */}
                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                    <MetricBox label="CANAL_SEGURO" value="ESTABELECIDO" />
                    <MetricBox label="BANCO_BIOMETRICO" value={`${alunosAtivos.length} NODOS`} />
                    <MetricBox label="LATENCIA" value="14MS" />
                </div>
            </main>

            <footer className="p-8 flex justify-center opacity-10 grayscale hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-black tracking-[1em] text-white">BXVS_PRO_SYSTEMS</p>
            </footer>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}

function MetricBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center">
            <span className="text-[6px] font-black text-zinc-700 tracking-widest uppercase">{label}</span>
            <span className="text-[8px] font-black text-white italic">{value}</span>
        </div>
    );
}