import { HeroSkeleton, ShopCardSkeleton, StorySkeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--black)]">
      {/* Hero Section Skeleton */}
      <HeroSkeleton />

      {/* Stories Section Skeleton */}
      <section className="py-4 sm:py-8 bg-[var(--main-bg)]">
        <div className="container">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <StorySkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* How It Works Section Skeleton */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-white via-[#fefefe] to-[#f8fafc] relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 sm:top-20 start-5 sm:start-10 w-40 sm:w-64 h-40 sm:h-64 bg-[var(--primary)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 sm:bottom-20 end-5 sm:end-10 w-48 sm:w-80 h-48 sm:h-80 bg-[#267881]/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          {/* Section Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 rounded-full px-4 py-2 mb-4 sm:mb-6 border border-[var(--primary)]/10">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]/40 animate-pulse" />
              <div className="w-20 h-3 bg-[var(--primary)]/20 rounded animate-pulse" />
            </div>
            <div className="w-64 sm:w-80 h-8 sm:h-10 lg:h-12 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl mx-auto animate-pulse" />
          </div>

          {/* Spacer */}
          <div className="h-6 sm:h-10 lg:h-16" />

          {/* Steps Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-5">
            {[
              { color: '#FF3D00' },
              { color: '#4CAF50' },
              { color: '#9C27B0' },
              { color: '#267881' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Circle */}
                <div className="relative mb-3 sm:mb-6">
                  <div 
                    className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full animate-pulse"
                    style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)` }}
                  />
                  <div 
                    className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 w-6 h-6 sm:w-9 sm:h-9 bg-white rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: `${item.color}30` }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold" style={{ color: `${item.color}50` }}>0{i + 1}</span>
                  </div>
                </div>

                {/* Card */}
                <div className="w-full bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-3/4 h-4 sm:h-5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg mx-auto mb-2 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-full h-3 bg-gray-50 rounded animate-pulse" />
                    <div className="w-5/6 h-3 bg-gray-50 rounded mx-auto animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Recommended Shops Section Skeleton */}
      <section className="py-6 sm:py-12 lg:py-16 bg-[var(--main-bg)]">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5 sm:mb-8 lg:mb-10">
            <div>
              <div className="w-40 sm:w-52 h-6 sm:h-8 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse mb-2" />
              <div className="w-28 sm:w-36 h-4 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100/50">
              <div className="w-14 sm:w-16 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Shops Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Download App Section Skeleton */}
      <section className="py-10 sm:py-16 lg:py-20 bg-[#0a1628] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[var(--primary)]/20 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 end-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[var(--primary-dark)]/20 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Content */}
            <div className="text-center lg:text-start">
              <div className="w-28 h-8 bg-white/10 rounded-full mx-auto lg:mx-0 mb-5 sm:mb-8 animate-pulse" />
              <div className="space-y-2 mb-4 sm:mb-6">
                <div className="w-4/5 h-8 sm:h-10 lg:h-12 bg-white/10 rounded-lg mx-auto lg:mx-0 animate-pulse" />
                <div className="w-2/5 h-8 sm:h-10 lg:h-12 bg-[var(--primary)]/20 rounded-lg mx-auto lg:mx-0 animate-pulse" />
              </div>
              <div className="w-full max-w-lg h-5 bg-white/8 rounded mx-auto lg:mx-0 mb-6 sm:mb-10 animate-pulse" />

              {/* App store buttons skeleton */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 mb-8 sm:mb-12">
                <div className="w-36 sm:w-44 h-14 bg-gradient-to-b from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/30 animate-pulse" />
                <div className="w-36 sm:w-44 h-14 bg-gradient-to-b from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/30 animate-pulse" />
              </div>

              {/* Stats skeleton */}
              <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-white/10">
                <div className="text-center lg:text-start">
                  <div className="w-12 h-8 bg-white/10 rounded mx-auto lg:mx-0 mb-1.5 animate-pulse" />
                  <div className="flex items-center justify-center lg:justify-start gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-[var(--star)]/30 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
                <div className="w-px h-10 sm:h-14 bg-white/10" />
                <div className="text-center lg:text-start">
                  <div className="w-14 h-8 bg-white/10 rounded mx-auto lg:mx-0 mb-1.5 animate-pulse" />
                  <div className="w-16 h-4 bg-white/8 rounded mx-auto lg:mx-0 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Phone mockup skeleton */}
            <div className="relative flex justify-center py-6 sm:py-10 lg:py-16">
              <div className="relative w-40 sm:w-52 lg:w-64 aspect-[9/18]">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-[var(--primary-dark)]/50 to-[var(--primary)]/30 rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden relative animate-pulse">
                    {/* Notch */}
                    <div className="absolute top-0 inset-x-0 flex justify-center pt-1.5 sm:pt-2">
                      <div className="w-16 h-4 sm:w-24 sm:h-6 bg-black/50 rounded-full" />
                    </div>
                    {/* Content placeholder */}
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 animate-pulse mb-3" />
                      <div className="w-20 h-3 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
