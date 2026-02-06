"use client"

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 font-sans">
            {/* Header Skeleton */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="w-20 h-5 bg-zinc-900 animate-pulse rounded-full" />
                        <div className="w-24 h-5 bg-zinc-900 animate-pulse rounded-full" />
                    </div>
                    <div className="w-64 h-12 bg-zinc-900 animate-pulse rounded-2xl" />
                </div>
                <div className="flex gap-3">
                    <div className="w-32 h-10 bg-zinc-900 animate-pulse rounded-2xl" />
                    <div className="w-32 h-10 bg-zinc-900 animate-pulse rounded-2xl" />
                    <div className="w-48 h-10 bg-zinc-900 animate-pulse rounded-2xl" />
                </div>
            </header>

            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-6 space-y-4">
                        <div className="flex justify-between">
                            <div className="w-20 h-4 bg-zinc-800 animate-pulse rounded" />
                            <div className="w-8 h-8 bg-zinc-800 animate-pulse rounded-lg" />
                        </div>
                        <div className="w-24 h-8 bg-zinc-800 animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Graph Skeleton */}
                    <div className="h-[380px] bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-6">
                        <div className="w-40 h-5 bg-zinc-800 animate-pulse rounded mb-8" />
                        <div className="w-full h-full bg-zinc-800/20 animate-pulse rounded-xl" />
                    </div>

                    {/* Present List Skeleton */}
                    <div className="space-y-4">
                        <div className="w-48 h-5 bg-zinc-900 animate-pulse rounded mb-6" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-zinc-800 animate-pulse rounded-xl" />
                                    <div className="space-y-2">
                                        <div className="w-24 h-4 bg-zinc-800 animate-pulse rounded" />
                                        <div className="w-16 h-3 bg-zinc-800 animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    <div className="h-32 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-6" />
                    <div className="h-64 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-6" />
                    <div className="h-64 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-6" />
                </div>
            </div>
        </div>
    );
}