import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function DashboardSkeleton() {
  return (
    // SkeletonTheme ajustado para o modo escuro (zinc-950) do seu dashboard
    <SkeletonTheme baseColor="#18181b" highlightColor="#27272a">
      <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans">
        
        {/* HEADER SKELETON */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Skeleton width={100} height={16} className="mb-2 rounded-full" />
            <Skeleton width={300} height={40} />
          </div>
          <div className="flex gap-3">
            <Skeleton width={120} height={45} borderRadius={16} />
            <Skeleton width={120} height={45} borderRadius={16} />
            <Skeleton width={200} height={45} borderRadius={16} />
          </div>
        </header>

        {/* METRIC CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] flex justify-between items-center">
              <div className="flex-1">
                <Skeleton width={80} height={10} className="mb-2" />
                <Skeleton width={120} height={30} />
              </div>
              <Skeleton width={44} height={44} borderRadius={12} />
            </div>
          ))}
        </div>

        {/* MAIN CONTENT SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda (Gráfico e Alunos Presentes) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
              <Skeleton width={150} height={20} className="mb-6" />
              <Skeleton height={280} borderRadius={20} />
            </div>

            <section>
              <Skeleton width={200} height={20} className="mb-6 ml-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl flex items-center gap-3">
                    <Skeleton circle width={40} height={40} />
                    <div className="flex-1">
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="40%" height={10} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Coluna da Direita (Sidebars) */}
          <div className="space-y-6">
            {/* Risco de Abandono */}
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2.5rem]">
              <Skeleton width={140} height={20} className="mb-6" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <Skeleton width="50%" height={12} />
                    <Skeleton width="30%" height={8} />
                  </div>
                  <Skeleton width={32} height={32} borderRadius={8} />
                </div>
              ))}
            </div>

            {/* Recuperação */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem]">
              <Skeleton width={120} height={20} className="mb-6" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-3">
                  <div className="flex-1">
                    <Skeleton width="60%" height={12} />
                    <Skeleton width="40%" height={8} />
                  </div>
                  <Skeleton width={60} height={28} borderRadius={12} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </SkeletonTheme>
  );
}