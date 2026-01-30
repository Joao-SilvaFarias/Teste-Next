'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import * as faceapi from 'face-api.js';
import { useSearchParams } from 'next/navigation';

function RegistrarRostoConteudo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const searchParams = useSearchParams();
    
    // Captura os dois possíveis parâmetros da URL
    const emailDaUrl = searchParams.get('email'); 
    const sessionId = searchParams.get('session_id');
    
    const [status, setStatus] = useState('Carregando IA...');
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        // Se não tiver e-mail nem session_id, algo está errado
        if (!emailDaUrl && !sessionId) {
            setStatus('❌ Erro: Identificação não encontrada na URL');
            return;
        }
        iniciarSistema();
    }, [emailDaUrl, sessionId]);

    async function iniciarSistema() {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setStatus('Posicione seu rosto na frente da câmera');
        } catch (err) {
            setStatus('❌ Erro ao acessar câmera ou modelos');
        }
    }

    async function capturarBioMetria() {
        if (!videoRef.current || carregando) return;

        setCarregando(true);
        setStatus('Analisando rosto...');

        const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const faceArray = Array.from(detection.descriptor);

            try {
                const res = await fetch('/api/salvar-rosto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailDaUrl?.includes('{') ? null : emailDaUrl, // Ignora se for o texto do Stripe
                        sessionId: sessionId,
                        faceDescriptor: faceArray
                    }),
                });

                const resultado = await res.json();

                if (resultado.success) {
                    setStatus(`✅ SUCESSO! Biometria cadastrada.`);
                } else {
                    setStatus('❌ Erro: ' + resultado.error);
                }
            } catch (err) {
                setStatus('❌ Erro na comunicação com o servidor');
            }
        } else {
            alert('Rosto não detectado. Tente novamente.');
            setStatus('Posicione seu rosto na frente da câmera');
        }
        setCarregando(false);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 font-sans">
            <div className="max-w-md w-full text-center">
                <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase text-yellow-400">
                    Biometria Facial
                </h1>
                <p className={`mb-6 text-sm font-medium ${status.includes('❌') ? 'text-red-400' : 'text-zinc-400'}`}>
                    {status}
                </p>

                <div className="relative rounded-3xl overflow-hidden border-4 border-zinc-800 bg-black aspect-video shadow-2xl">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    {!status.includes('✅') && !status.includes('❌') && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-[2px] bg-yellow-400/50 shadow-[0_0_15px_#facc15] animate-[scan_3s_linear_infinite]" />
                        </div>
                    )}
                </div>

                <button
                    onClick={capturarBioMetria}
                    disabled={carregando || !!status.includes('✅')}
                    className="mt-8 w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-300 transition-all disabled:opacity-30 shadow-xl shadow-yellow-400/10"
                >
                    {carregando ? 'Processando...' : 'Capturar Biometria'}
                </button>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
            `}</style>
        </div>
    );
}

export default function RegistrarRosto() {
    return (
        <Suspense fallback={<div className="text-white text-center mt-10">Carregando...</div>}>
            <RegistrarRostoConteudo />
        </Suspense>
    );
}