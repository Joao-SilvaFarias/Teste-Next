'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, CheckCircle, XCircle, Clock, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecepcaoCheckin() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    // Estados de Controle
    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);
    const [statusCor, setStatusCor] = useState('zinc'); // zinc, green, red, yellow

    // --- 1. FUNÇÕES DE ÁUDIO (FEEDBACK SONORO) ---
    const playSuccess = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
    };

    const playError = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
    };

    // --- 2. PROTEÇÃO DE ROTA E CLEANUP ---
    useEffect(() => {
        if (!authLoading && !isAdmin) router.replace('/');

        return () => {
            // Desliga a câmera ao sair da página para poupar hardware
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [authLoading, isAdmin, router]);

    // --- 3. INICIALIZAÇÃO DA IA E DADOS ---
    useEffect(() => {
        if (!authLoading && isAdmin) {
            async function prepararRecepcao() {
                try {
                    // 1. Liga a câmera IMEDIATAMENTE (O usuário vê que o sistema está vivo)
                    setMensagem('Ligando câmera...');
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 640, height: 480 }
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }

                    // 2. Carrega a IA e os Dados em paralelo enquanto a câmera já aparece
                    setMensagem('Carregando inteligência...');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                        // Sincroniza alunos ao mesmo tempo que carrega a IA
                        supabase.from('alunos')
                            .select('nome, email, face_descriptor')
                            .eq('status_assinatura', 'ativo')
                            .not('face_descriptor', 'is', null)
                            .then(({ data }) => setAlunosAtivos(data || []))
                    ]);

                    setSistemaPronto(true);
                    setMensagem('Aproxime-se');
                    setStatusCor('zinc');
                } catch (err) {
                    setMensagem('❌ Erro rápido');
                    setStatusCor('red');
                }
            }
            prepararRecepcao();
        }
    }, [authLoading, isAdmin]);

    // --- 4. LOOP DE RECONHECIMENTO (REAL-TIME) ---
    useEffect(() => {
        if (!sistemaPronto || estaProcessando || !isAdmin) return;

        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || estaProcessando) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                let melhorMatch = null;
                let menorDistancia = 0.42; // Limiar de precisão "blindado"

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
                        melhorMatch = aluno;
                    }
                }

                if (melhorMatch) {
                    executarFluxoAcesso(melhorMatch);
                }
            }
        }, 700);

        return () => clearInterval(interval);
    }, [alunosAtivos, estaProcessando, sistemaPronto, isAdmin]);

    // --- 5. LÓGICA DE NEGÓCIO (ENTRADA/SAÍDA) ---
    async function executarFluxoAcesso(aluno: any) {
        // 1. Bloqueia novas leituras IMEDIATAMENTE
        setEstaProcessando(true);
        setStatusCor('yellow');
        setMensagem(`Identificando...`);

        try {
            // Busca o último registro (Rápido)
            const { data: ultimo } = await supabase
                .from('checkins')
                .select('tipo, data_hora')
                .eq('email', aluno.email)
                .order('data_hora', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Trava de segurança (Cooldown por ALUNO) - Reduzida para 1 minuto
            if (ultimo) {
                const agora = new Date().getTime();
                const ultimaVez = new Date(ultimo.data_hora).getTime();
                if (agora - ultimaVez < 60000) {
                    setMensagem('ACESSO RECENTE');
                    setStatusCor('yellow');
                    // Libera o sistema para o PRÓXIMO da fila mais rápido (em 1.5s)
                    setTimeout(() => {
                        setEstaProcessando(false);
                        setStatusCor('zinc');
                        setMensagem('Aguardando rosto...');
                    }, 1500);
                    return;
                }
            }

            const proximoTipo = ultimo?.tipo === 'entrada' ? 'saida' : 'entrada';

            // Grava no banco sem "await" pesado se possível, ou com await curto
            const { error: insertError } = await supabase.from('checkins').insert([{
                email: aluno.email,
                aluno_nome: aluno.nome,
                tipo: proximoTipo,
                data_hora: new Date().toISOString()
            }]);

            if (insertError) throw insertError;

            // Sucesso: Mensagem curta e grossa
            setMensagem(`✅ ${proximoTipo === 'entrada' ? 'ENTROU' : 'SAIU'}: ${aluno.nome.split(' ')[0]}`);
            setStatusCor('green');
            playSuccess();

        } catch (err) {
            setMensagem('❌ ERRO');
            setStatusCor('red');
            playError();
        } finally {
            // O SEGREDO DO TEMPO: 1.8 segundos é o "sweet spot"
            // É o tempo do aluno dar um passo e o próximo chegar
            setTimeout(() => {
                setEstaProcessando(false);
                setMensagem('Próximo...');
                setStatusCor('zinc');
            }, 1800);
        }
    }

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#9ECD1D] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 overflow-hidden font-sans">

            {/* Header Estilizado */}
            <header className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Camera className="text-[#9ECD1D]" size={32} />
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                        Smart <span className="text-[#9ECD1D]">Gate</span>
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">IA Monitoring Active</p>
                </div>
            </header>

            {/* Banner de Feedback Central */}
            <div className={`w-full max-w-2xl p-10 rounded-[3rem] mb-10 text-center transition-all duration-500 border-b-[10px] shadow-2xl flex items-center justify-center gap-6 ${statusCor === 'green' ? 'bg-green-600 border-green-800 shadow-green-900/20' :
                statusCor === 'red' ? 'bg-red-600 border-red-800 animate-shake' :
                    statusCor === 'yellow' ? 'bg-yellow-500 text-black border-yellow-700' :
                        'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}>
                {statusCor === 'green' && <CheckCircle className="w-12 h-12" />}
                {statusCor === 'red' && <XCircle className="w-12 h-12" />}
                {statusCor === 'yellow' && <Clock className="w-12 h-12 animate-spin" />}
                <span className="text-3xl font-black uppercase italic tracking-tighter">
                    {mensagem}
                </span>
            </div>

            {/* Container da Câmera (Viewport) */}
            <div className="relative rounded-[4rem] overflow-hidden border-[16px] border-zinc-900 bg-black aspect-video max-w-4xl w-full group shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    className={`w-full h-full object-cover scale-x-[-1] brightness-110 contrast-110 transition-all duration-700 ${estaProcessando ? 'blur-3xl opacity-20' : 'opacity-100'}`}
                />

                {/* Elementos Visuais de Scan */}
                {sistemaPronto && !estaProcessando && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-1 bg-[#9ECD1D] shadow-[0_0_30px_#9ECD1D] absolute animate-scan z-10" />
                        <div className="absolute inset-0 border-[60px] border-black/10" />
                        <div className="absolute top-10 left-10 w-24 h-24 border-t-8 border-l-8 border-[#9ECD1D] rounded-tl-[2rem]" />
                        <div className="absolute top-10 right-10 w-24 h-24 border-t-8 border-r-8 border-[#9ECD1D] rounded-tr-[2rem]" />
                        <div className="absolute bottom-10 left-10 w-24 h-24 border-b-8 border-l-8 border-[#9ECD1D] rounded-bl-[2rem]" />
                        <div className="absolute bottom-10 right-10 w-24 h-24 border-b-8 border-r-8 border-[#9ECD1D] rounded-br-[2rem]" />
                    </div>
                )}

                {estaProcessando && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-32 h-32 text-[#9ECD1D] animate-spin opacity-40" />
                    </div>
                )}
            </div>

            {/* Indicadores de Conexão */}
            <footer className="mt-12 flex gap-8">
                <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    <div className="w-2 h-2 bg-[#9ECD1D] rounded-full shadow-[0_0_8px_#9ECD1D]" />
                    Biometria Ativa
                </div>
                <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    <div className="w-2 h-2 bg-[#9ECD1D] rounded-full shadow-[0_0_8px_#9ECD1D]" />
                    Database Cloud
                </div>
            </footer>

            <style jsx>{`
                @keyframes scan { 0% { top: 5%; } 100% { top: 95%; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 60% { transform: translateX(10px); } }
                .animate-scan { animation: scan 3s ease-in-out infinite; }
                .animate-shake { animation: shake 0.2s ease-in-out infinite; }
            `}</style>
        </div>
    );
}