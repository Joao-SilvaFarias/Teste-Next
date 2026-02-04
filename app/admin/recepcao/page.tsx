'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Camera, Smartphone, ShieldCheck, ArrowLeftRight } from 'lucide-react';

export default function RecepcaoCheckinDefinitiva() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);
    const [statusCor, setStatusCor] = useState('zinc');
    const { isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && isAdmin) {
            const carregarRecursos = async () => {
                try {
                    setMensagem('Carregando IA...');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                        supabase.from('alunos').select('nome, email, face_descriptor')
                            .eq('status_assinatura', 'ativo').then(({ data }) => setAlunosAtivos(data || []))
                    ]);
                    iniciarCamera();
                } catch (err) {
                    setMensagem('Erro ao carregar IA');
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
            setMensagem('Erro de Câmera');
            setStatusCor('red');
        }
    };

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
    }, [sistemaPronto, estaProcessando, alunosAtivos]);

    // --- 4. LÓGICA DE MOVIMENTAÇÃO (CHECK-IN / CHECK-OUT) ---
    // --- LÓGICA DE MOVIMENTAÇÃO COM TRAVA DE SEGURANÇA ---
    async function processarMovimentacao(aluno: any) {
        if (estaProcessando) return;
        setEstaProcessando(true);
        setStatusCor('yellow');
        setMensagem('Verificando...');

        try {
            // 1. Busca o último registro absoluto deste aluno
            const { data: ultimoRegistro, error: fetchError } = await supabase
                .from('checkins')
                .select('tipo, data_hora')
                .eq('email', aluno.email)
                .order('data_hora', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            const agora = new Date();
            const COOLDOWN_MINUTOS = 5; // Tempo mínimo entre checkin e checkout

            if (ultimoRegistro) {
                const dataUltimo = new Date(ultimoRegistro.data_hora);
                const diferencaMilissegundos = agora.getTime() - dataUltimo.getTime();
                const diferencaMinutos = diferencaMilissegundos / (1000 * 60);

                // Se tentou bater o ponto em menos de 5 minutos, bloqueia
                if (diferencaMinutos < COOLDOWN_MINUTOS) {
                    const segundosRestantes = Math.ceil((COOLDOWN_MINUTOS - diferencaMinutos) * 60);

                    setMensagem(`Aguarde ${segundosRestantes}s para nova ação`);
                    setStatusCor('zinc');

                    // Som de aviso/erro curto
                    new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3').play().catch(() => { });

                    // Mantém a mensagem de erro por 3 segundos antes de liberar a câmera
                    setTimeout(() => {
                        setEstaProcessando(false);
                        setStatusCor('zinc');
                        setMensagem('Aproxime o Rosto');
                    }, 3000);
                    return;
                }
            }

            // 2. Define o novo tipo (Inversão de estado)
            const novoTipo = ultimoRegistro?.tipo === 'entrada' ? 'saida' : 'entrada';

            // 3. Salva no Banco
            const { error: insertError } = await supabase.from('checkins').insert([{
                email: aluno.email,
                aluno_nome: aluno.nome,
                tipo: novoTipo,
                data_hora: agora.toISOString()
            }]);

            if (insertError) throw insertError;

            // 4. Feedback de Sucesso
            const greeting = novoTipo === 'entrada' ? 'BEM-VINDO' : 'ATÉ LOGO';
            setMensagem(`${greeting}, ${aluno.nome.split(' ')[0]}!`);
            setStatusCor('green');

            const sound = novoTipo === 'entrada'
                ? 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
                : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
            new Audio(sound).play().catch(() => { });

            // 5. Cooldown de interface: trava por 5 segundos após sucesso para a pessoa sair da frente
            setTimeout(() => {
                setEstaProcessando(false);
                setStatusCor('zinc');
                setMensagem('Aproxime o Rosto');
            }, 5000);

        } catch (err) {
            console.error("Erro na operação:", err);
            setMensagem('Erro de Sincronização');
            setStatusCor('red');
            setEstaProcessando(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">

            <header className="mb-6 sm:mb-10 text-center">
                <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase mb-2">
                    Smart<span className="text-[#9ECD1D]">Gate</span>
                </h1>
                <div className="flex items-center justify-center gap-2 opacity-50">
                    <ArrowLeftRight size={14} className="text-[#9ECD1D]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Check-in & Out System</p>
                </div>
            </header>

            <div className={`w-full max-w-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] mb-6 text-center transition-all duration-500 border-b-4 sm:border-b-8 shadow-2xl ${statusCor === 'green' ? 'bg-emerald-600 border-emerald-800' :
                    statusCor === 'red' ? 'bg-red-600 border-red-800' :
                        statusCor === 'yellow' ? 'bg-yellow-500 text-black border-yellow-700' :
                            'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}>
                <span className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter block truncate">
                    {mensagem}
                </span>
            </div>

            <div className="relative w-full max-w-md sm:max-w-3xl aspect-[3/4] sm:aspect-video rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-[6px] sm:border-[12px] border-zinc-900 bg-black shadow-inner">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover mirror"
                />

                {sistemaPronto && !estaProcessando && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-[#9ECD1D]/30 rounded-[3rem] animate-pulse relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4">
                                <Camera size={24} className="text-[#9ECD1D] opacity-50" />
                            </div>
                        </div>
                    </div>
                )}

                {estaProcessando && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="w-12 h-12 text-[#9ECD1D] animate-spin" />
                    </div>
                )}
            </div>

            <footer className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-12 opacity-20 grayscale italic items-center text-center">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                    <Smartphone size={14} /> Auto Check-Out Enabled
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                    <ShieldCheck size={14} /> Secure Biometry
                </div>
            </footer>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
}