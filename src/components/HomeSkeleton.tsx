'use client';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function HomeSkeleton() {
  return (
    <SkeletonTheme baseColor="#18181b" highlightColor="#27272a">
      <div className="min-h-screen bg-zinc-950 text-white">
        
        {/* HERO SKELETON */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl w-full flex flex-col items-center">
            {/* Título Principal (Treine no Futuro) */}
            <div className="mb-8">
              <Skeleton width={300} height={60} className="md:w-[600px] md:height-[80px]" />
              <div className="mt-4">
                <Skeleton width={200} height={60} className="md:w-[400px] md:height-[80px]" />
              </div>
            </div>

            {/* Subtexto */}
            <div className="mb-10">
              <Skeleton width={280} height={20} />
            </div>

            {/* Input e Botão de e-mail */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Skeleton height={56} borderRadius={16} className="flex-1" />
              <Skeleton width={140} height={56} borderRadius={16} />
            </div>
          </div>
        </section>

        {/* SEÇÃO DE PLANOS SKELETON */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Card Bronze */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800">
              <Skeleton width={100} height={24} className="mb-4" />
              <Skeleton width={150} height={48} className="mb-8" />
              <div className="space-y-4 mb-10">
                <Skeleton count={3} height={15} />
              </div>
              <Skeleton height={56} borderRadius={16} />
            </div>

            {/* Card Silver (Destaque) */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 scale-110">
              <Skeleton width={100} height={24} className="mb-4" />
              <Skeleton width={150} height={48} className="mb-8" />
              <div className="space-y-4 mb-10">
                <Skeleton count={4} height={15} />
              </div>
              <Skeleton height={56} borderRadius={16} />
            </div>

            {/* Card Gold */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800">
              <Skeleton width={100} height={24} className="mb-4" />
              <Skeleton width={150} height={48} className="mb-8" />
              <div className="space-y-4 mb-10">
                <Skeleton count={3} height={15} />
              </div>
              <Skeleton height={56} borderRadius={16} />
            </div>
          </div>
        </section>

        {/* FOOTER SKELETON */}
        <footer className="py-20 border-t border-zinc-900 flex flex-col items-center gap-4">
          <Skeleton width={250} height={12} />
          <Skeleton width={100} height={10} />
        </footer>
      </div>
    </SkeletonTheme>
  );
}