'use client';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function LoginSkeleton() {
  return (
    <SkeletonTheme baseColor="#18181b" highlightColor="#27272a">
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          
          {/* Título ADMIN LOGIN */}
          <div className="text-center mb-8">
            <Skeleton width={200} height={36} borderRadius={8} />
          </div>

          {/* Card do Formulário */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] space-y-5">
            
            {/* Campo E-mail */}
            <div>
              <Skeleton width={50} height={12} className="ml-1 mb-2" />
              <Skeleton height={56} borderRadius={12} />
            </div>

            {/* Campo Senha */}
            <div>
              <Skeleton width={50} height={12} className="ml-1 mb-2" />
              <Skeleton height={56} borderRadius={12} />
            </div>

            {/* Botão Acessar */}
            <div className="pt-4">
              <Skeleton height={56} borderRadius={12} />
            </div>
          </div>

          {/* Botão Voltar */}
          <div className="text-center mt-6">
            <Skeleton width={120} height={10} />
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}