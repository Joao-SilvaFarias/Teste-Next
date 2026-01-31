'use client';
import { Camera, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AvisoBiometria({ temFoto }: { temFoto: boolean }) {
  if (temFoto) return null;

  return (
    <div className="bg-[#9ECD1D] text-black p-4 text-center font-bold flex flex-col md:flex-row items-center justify-center gap-4 animate-pulse">
      <div className="flex items-center gap-2 uppercase tracking-tighter italic">
        <Camera size={20} />
        Atenção: Sua biometria facial ainda não foi cadastrada!
      </div>
      <Link 
        href="/perfil/rosto" 
        className="bg-black text-white px-6 py-2 rounded-full text-xs uppercase font-black hover:scale-105 transition-all flex items-center gap-2"
      >
        Cadastrar Agora <ArrowRight size={14} />
      </Link>
    </div>
  );
}