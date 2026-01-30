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

                // 2. Buscar alunos (removi o filtro de status para teste imediato)
                const { data, error } = await supabase
                    .from('alunos')
                    .select('nome, face_descriptor')
                    .not('face_descriptor', 'is', null);

                if (error) throw error;
                console.log("Alunos carregados:", data?.length);
                setAlunosAtivos(data || []);

                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef.current) videoRef.current.srcObject = stream;
                
                setMensagem('Aguardando rosto...');
            } catch (err) {
                setMensagem('❌ Erro ao iniciar');
            }
        }
        prepararRecepcao();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            // Se não houver vídeo ou alunos, ou se já estivermos processando um acesso, ignora
            if (!videoRef.current || alunosAtivos.length === 0 || estaProcessando) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                let melhorMatch = null;
                let menorDistancia = 0.55; // Aumentei para 0.55 (mais tolerante)

                for (const aluno of alunosAtivos) {
                    // CORREÇÃO CRÍTICA: Garantir que o descritor seja um Float32Array
                    // O Supabase às vezes retorna como objeto {0: 0.1, 1: 0.2...}
                    const rawDescriptor = Array.isArray(aluno.face_descriptor) 
                        ? aluno.face_descriptor 
                        : Object.values(aluno.face_descriptor);

                    const descritorSalvo = new Float32Array(rawDescriptor);
                    
                    const distancia = faceapi.euclideanDistance(
                        detection.descriptor,
                        descritorSalvo
                    );

                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        melhorMatch = aluno.nome;
                    }
                }

                if (melhorMatch) {
                    setEstaProcessando(true);
                    setMensagem(`✅ BEM-VINDO: ${melhorMatch.toUpperCase()}`);

                    await supabase.from('checkins').insert([{ aluno_nome: melhorMatch }]);
                    
                    setTimeout(() => {
                        setMensagem('Aguardando rosto...');
                        setEstaProcessando(false);
                    }, 4000); 
                } else {
                    // Se detectou rosto mas não reconheceu ninguém
                    setMensagem('❌ NÃO RECONHECIDO');
                    setTimeout(() => !estaProcessando && setMensagem('Aguardando rosto...'), 1000);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [alunosAtivos, estaProcessando]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white font-sans p-4">
            <h1 className="text-3xl font-black mb-8 text-yellow-400 italic">SMART RECEPÇÃO</h1>

            <div className={`w-full max-w-md p-6 rounded-2xl mb-8 text-center text-xl font-bold border-4 transition-all ${
                mensagem.includes('✅') ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 
                mensagem.includes('❌') ? 'bg-red-900 border-red-600 text-white' : 
                'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
                {mensagem}
            </div>

            <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-zinc-900 shadow-2xl">
                <video ref={videoRef} autoPlay muted width="640" height="480" className="scale-x-[-1]" />
                <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20"></div>
                {!estaProcessando && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 shadow-[0_0_15px_#facc15] animate-scan"></div>
                )}
            </div>

            <style jsx>{`
                @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
                .animate-scan { position: absolute; animation: scan 3s linear infinite; }
            `}</style>
        </div>
    );
}