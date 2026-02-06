'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import * as faceapi from 'face-api.js';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { Camera, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

function RegistrarRostoConteudo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const emailDaUrl = searchParams.get('email'); 
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState('Iniciando sistema...');
  const [carregando, setCarregando] = useState(false);
  const [emailFinal, setEmailFinal] = useState<string | null>(null);

  useEffect(() => {
    async function identificarUsuario() {
      if (emailDaUrl && !emailDaUrl.includes('{')) {
        setEmailFinal(emailDaUrl);
        iniciarSistema();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setEmailFinal(session.user.email);
        iniciarSistema();
      } else if (sessionId) {
        iniciarSistema();
      } else {
        setStatus('❌ Erro: Identificação não encontrada.');
      }
    }
    identificarUsuario();
  }, [emailDaUrl, sessionId]);

  async function iniciarSistema() {
    try {
      setStatus('Carregando IA de reconhecimento...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('Posicione seu rosto no centro');
    } catch (err) {
      setStatus('❌ Erro ao acessar câmera');
    }
  }

  async function capturarBioMetria() {
    if (!videoRef.current || carregando) return;

    setCarregando(true);
    setStatus('Analisando traços faciais...');

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
            email: emailFinal, 
            sessionId: sessionId,
            faceDescriptor: faceArray
          }),
        });

        const resultado = await res.json();

        if (resultado.success) {
          setStatus('✅ Biometria cadastrada com sucesso!');
          setTimeout(() => router.push('/perfil'), 2000);
        } else {
          setStatus('❌ ' + resultado.error);
        }
      } catch (err) {
        setStatus('❌ Erro na comunicação com servidor');
      }
    } else {
      setStatus('Rosto não detectado. Tente novamente.');
    }
    setCarregando(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 font-sans selection:bg-[#9ECD1D] selection:text-black">
      <div className="max-w-md w-full text-center">
        
        {/* Header Padronizado */}
        <header className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#9ECD1D]/10 p-3 rounded-2xl">
              <Camera className="text-[#9ECD1D]" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-smart-title italic mb-2 tracking-tighter">
            Bio<span className="text-[#9ECD1D]">ID</span>
          </h1>
          <p className={`text-[10px] font-smart-detail tracking-[0.2em] ${status.includes('❌') ? 'text-red-500' : 'text-zinc-500'}`}>
            {status.toUpperCase()}
          </p>
        </header>

        {/* Container da Câmera com Estilo Cyberpunk */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-b from-[#9ECD1D]/20 to-transparent rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative rounded-[2rem] overflow-hidden border-2 border-zinc-800 bg-black aspect-square md:aspect-video shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
            
            {/* Overlay de Escaneamento */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
            
            {/* Linha de Scan Ativa */}
            {!status.includes('✅') && !status.includes('❌') && (
              <div className="absolute inset-x-0 h-[2px] bg-[#9ECD1D] shadow-[0_0_15px_#9ECD1D] animate-scan pointer-events-none" />
            )}

            {/* Cantos da Moldura */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-[#9ECD1D] rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-[#9ECD1D] rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-[#9ECD1D] rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-[#9ECD1D] rounded-br-lg" />
          </div>
        </div>

        {/* Botão de Ação Padronizado */}
        <button
          onClick={capturarBioMetria}
          disabled={carregando || status.includes('✅') || (!emailFinal && !sessionId)}
          className="mt-10 w-full bg-[#9ECD1D] text-black py-5 rounded-2xl font-smart-detail text-[10px] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-20 shadow-xl shadow-[#9ECD1D]/10 flex justify-center items-center gap-2"
        >
          {carregando ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processando Biometria
            </>
          ) : (
            'Realizar Cadastro Facial'
          )}
        </button>

        <p className="mt-8 text-[9px] text-zinc-600 font-smart-detail tracking-widest uppercase px-8 leading-relaxed">
          Sua face será criptografada para acesso exclusivo às catracas.
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function RegistrarRosto() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#9ECD1D]" size={40} />
        <p className="text-[10px] font-smart-detail text-zinc-500 animate-pulse">CARREGANDO MÓDULOS</p>
      </div>
    }>
      <RegistrarRostoConteudo />
    </Suspense>
  );
}