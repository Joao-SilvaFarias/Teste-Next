'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, CheckCircle, XCircle, Clock, Camera, Zap, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecepcaoCheckinDefinitiva() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);
    const [sistemaPronto, setSistemaPronto] = useState(false);
    const [statusCor, setStatusCor] = useState('zinc');

    // --- 1. CONFIGURAÇÃO INICIAL E CÂMERA ---
    useEffect(() => {
        if (!authLoading && isAdmin) {
            const preparar = async () => {
                try {
                    setMensagem('Carregando IA...');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                        supabase.from('alunos').select('nome, email, face_descriptor')
                            .eq('status_assinatura', 'ativo').then(({ data }) => setAlunosAtivos(data || []))
                    ]);

                    const html5QrCode = new Html5Qrcode("qr-reader");
                    scannerRef.current = html5QrCode;

                    const config = {
                        fps: 20,
                        qrbox: { width: 280, height: 280 },
                        aspectRatio: 1.777778
                    };

                    await html5QrCode.start(
                        { facingMode: "user" },
                        config,
                        (decodedText) => {
                            if (!estaProcessando) processarLeitura(decodedText, 'qr');
                        },
                        () => { } // Ignora falhas de frame sem QR
                    );

                    setSistemaPronto(true);
                    setMensagem('Aproxime Rosto ou QR');
                } catch (err) {
                    setMensagem('Erro de Câmera');
                    setStatusCor('red');
                }
            };
            preparar();
        }
        return () => { scannerRef.current?.stop().catch(() => { }); };
    }, [authLoading, isAdmin]);

    // --- 2. LOOP EXCLUSIVO PARA FACE API ---
    useEffect(() => {
        if (!sistemaPronto || estaProcessando) return;

        const interval = setInterval(async () => {
            const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (!videoElement || videoElement.paused || estaProcessando) return;

            const detection = await faceapi
                .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 }))
                .withFaceLandmarks() // <-- Faltava essa linha!
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
                if (melhorMatch) processarLeitura(melhorMatch, 'face');
            }
        }, 800);

        return () => clearInterval(interval);
    }, [sistemaPronto, estaProcessando, alunosAtivos]);

    // --- 3. PROCESSAMENTO UNIFICADO ---
    async function processarLeitura(data: any, tipo: 'qr' | 'face') {
        if (estaProcessando) return;
        setEstaProcessando(true);

        let alunoEncontrado = tipo === 'face' ? data : null;

        if (tipo === 'qr') {
            try {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                alunoEncontrado = alunosAtivos.find(a => a.email === parsed.email);
            } catch (e) {
                setEstaProcessando(false);
                return;
            }
        }

        if (!alunoEncontrado) {
            setEstaProcessando(false);
            return;
        }

        setStatusCor('yellow');
        setMensagem('Validando...');

        try {
            const { data: ultimo } = await supabase.from('checkins')
                .select('tipo, data_hora').eq('email', alunoEncontrado.email)
                .order('data_hora', { ascending: false }).limit(1).maybeSingle();

            const agora = new Date().getTime();
            if (ultimo && (agora - new Date(ultimo.data_hora).getTime() < 60000)) {
                setMensagem('Aguarde 1 min');
                new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(() => { });
            } else {
                const proximoTipo = ultimo?.tipo === 'entrada' ? 'saida' : 'entrada';
                await supabase.from('checkins').insert([{
                    email: alunoEncontrado.email, aluno_nome: alunoEncontrado.nome, tipo: proximoTipo, data_hora: new Date().toISOString()
                }]);
                setMensagem(`✅ ${proximoTipo.toUpperCase()}: ${alunoEncontrado.nome.split(' ')[0]}`);
                setStatusCor('green');
                new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => { });
            }
        } catch (err) {
            setMensagem('Erro de Conexão');
            setStatusCor('red');
        } finally {
            setTimeout(() => {
                setEstaProcessando(false);
                setStatusCor('zinc');
                setMensagem('Aproxime Rosto ou QR');
            }, 3000);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-sans">

            <header className="mb-8 text-center">
                <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">
                    Smart<span className="text-[#9ECD1D]">Gate</span>
                </h1>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Híbrido v2.0</p>
            </header>

            {/* Banner de Feedback */}
            <div className={`w-full max-w-2xl p-8 rounded-[2.5rem] mb-8 text-center transition-all duration-500 border-b-8 flex items-center justify-center gap-6 shadow-2xl ${statusCor === 'green' ? 'bg-emerald-600 border-emerald-800' :
                    statusCor === 'red' ? 'bg-red-600 border-red-800' :
                        statusCor === 'yellow' ? 'bg-yellow-500 text-black border-yellow-700' :
                            'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}>
                <span className="text-3xl font-black uppercase italic tracking-tighter">{mensagem}</span>
            </div>

            {/* Container da Câmera */}
            <div className="relative w-full max-w-3xl aspect-video rounded-[3rem] overflow-hidden border-[12px] border-zinc-900 bg-black shadow-inner">
                {/* O HTML5-QRCODE renderiza o vídeo aqui */}
                <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {/* Overlay de Scan */}
                {sistemaPronto && !estaProcessando && (
                    <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-[#9ECD1D]/50 rounded-3xl animate-pulse" />
                        <div className="absolute bottom-6 right-6 flex gap-4">
                            <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2">
                                <Zap size={14} className="text-[#9ECD1D]" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-white">QR Mode</span>
                            </div>
                            <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2">
                                <Camera size={14} className="text-[#9ECD1D]" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-white">Face ID</span>
                            </div>
                        </div>
                    </div>
                )}

                {estaProcessando && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="w-16 h-16 text-[#9ECD1D] animate-spin" />
                    </div>
                )}
            </div>

            <footer className="mt-10 flex gap-12 opacity-30 grayscale italic">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter"><Smartphone size={16} /> QR Access Ready</div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter"><Camera size={16} /> Biometry Ready</div>
            </footer>
        </div>
    );
}