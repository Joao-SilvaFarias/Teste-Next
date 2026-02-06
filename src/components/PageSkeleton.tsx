export default function PageSkeleton() {
  return (
    <div className="w-full min-h-screen bg-black p-6 space-y-8 animate-pulse">
      {/* Topo: Título e botões */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-zinc-900 rounded-lg" />
        <div className="h-10 w-32 bg-zinc-900 rounded-full" />
      </div>

      {/* Cards de destaque (ex: Total de alunos, presentes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-900/50 rounded-3xl border border-white/5" />
        ))}
      </div>

      {/* Área Central (Gráfico ou Lista) */}
      <div className="h-64 w-full bg-zinc-900/30 rounded-3xl border border-white/5" />

      {/* Rodapé da lista */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-full bg-zinc-900/20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}