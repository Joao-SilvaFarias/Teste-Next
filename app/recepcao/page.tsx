'use client';
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '../../src/lib/supabase';

export default function RecepcaoCheckin() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mensagem, setMensagem] = useState('Iniciando...');
    const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
    const [estaProcessando, setEstaProcessando] = useState(false);

    useEffect(() => {
        async function prepararRecepcao() {
            try {
                // 1. Carregar modelos
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);

                // 2. Buscar APENAS alunos ativos com biometria
                const { data, error } = await supabase
                    .from('alunos')
                    .select('nome, face_descriptor')
                    .eq('status_assinatura', 'ativo') // Garante o bloqueio de cancelados
                    .not('face_descriptor', 'is', null);

                if (error) throw error;
                setAlunosAtivos(data || []);

                // 3. Iniciar Câmera
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                if (videoRef.current) videoRef.current.srcObject = stream;

                setMensagem('Aguardando rosto...');
            } catch (err) {
                console.error(err);
                setMensagem('❌ Erro na Câmera/Modelos');
            }
        }
        prepararRecepcao();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!videoRef.current || alunosAtivos.length === 0 || estaProcessando) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                let melhorMatch = null;
                let menorDistancia = 0.50; // Um pouco mais rigoroso para evitar falsos positivos

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
                    
                    // Inserir checkin no banco
                    await supabase.from('checkins').insert([{
                        aluno_nome: melhorMatch,
                        data_hora: new Date().toISOString()
                    }]);

                    setTimeout(() => {
                        setMensagem('Aguardando rosto...');
                        setEstaProcessando(false);
                    }, 4000);
                } else {
                    // Detectou rosto mas não está na lista de ATIVOS
                    setMensagem('❌ ACESSO NEGADO OU NÃO CADASTRADO');
                    // Pequeno delay para não travar a tela no erro
                    setTimeout(() => !estaProcessando && setMensagem('Aguardando rosto...'), 2000);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [alunosAtivos, estaProcessando]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
            <h1 className="text-3xl font-black mb-8 text-[#9ECD1D] italic tracking-tighter">SMART RECEPÇÃO</h1>

            {/* BOX DE MENSAGEM DINÂMICO */}
            <div className={`w-full max-w-md p-6 rounded-2xl mb-8 text-center text-xl font-bold border-4 transition-all duration-300 ${
                mensagem.includes('✅') ? 'bg-green-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                mensagem.includes('❌') ? 'bg-red-600 border-red-400 animate-shake' :
                'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
                {mensagem}
            </div>

            {/* CONTAINER DO VÍDEO */}
            <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-zinc-900 shadow-2xl bg-zinc-900">
                <video ref={videoRef} autoPlay muted width="640" height="480" className="scale-x-[-1] object-cover" />
                
                {/* Overlay de Scan */}
                {!estaProcessando && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#9ECD1D] shadow-[0_0_20px_#9ECD1D] animate-scan"></div>
                )}
                
                {/* Moldura de Foco */}
                <div className="absolute inset-0 border-[40px] border-black/10 pointer-events-none"></div>
            </div>

            <style jsx>{`
                @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-scan { position: absolute; animation: scan 2s linear infinite; }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
}