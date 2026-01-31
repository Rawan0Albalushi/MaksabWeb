import { HeroSkeleton, ShopCardSkeleton } from '@/components/ui';

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
              <div key={i} className="flex-shrink-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] bg-gradient-to-br from-gray-200 to-gray-300">
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* How It Works Section Skeleton */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-white via-[#fefefe] to-[#f8fafc] relative overflow-hidden">
        <div className="container relative z-10">
          {/* Section Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-4 sm:mb-6 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="w-20 h-3 bg-gray-300 rounded" />
            </div>
            <div className="w-64 sm:w-80 h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg mx-auto animate-pulse" />
          </div>

          {/* Spacer */}
          <div className="h-6 sm:h-10 lg:h-16" />

          {/* Steps Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Circle */}
                <div className="relative mb-3 sm:mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-200 animate-pulse" />
                  <div className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 w-6 h-6 sm:w-9 sm:h-9 bg-gray-100 rounded-full border-2 border-gray-200 animate-pulse" />
                </div>

                {/* Card */}
                <div className="w-full bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4">
                  <div className="w-3/4 h-4 sm:h-5 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-full h-3 bg-gray-100 rounded animate-pulse" />
                    <div className="w-5/6 h-3 bg-gray-100 rounded mx-auto animate-pulse" />
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
              <div className="w-40 sm:w-52 h-6 sm:h-8 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="w-28 sm:w-36 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-20 sm:w-28 h-9 sm:h-10 bg-white rounded-lg sm:rounded-xl animate-pulse" />
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
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Content */}
            <div className="text-center lg:text-start">
              <div className="w-28 h-8 bg-white/10 rounded-full mx-auto lg:mx-0 mb-5 sm:mb-8 animate-pulse" />
              <div className="space-y-2 mb-4 sm:mb-6">
                <div className="w-4/5 h-8 sm:h-10 lg:h-12 bg-white/10 rounded-lg mx-auto lg:mx-0 animate-pulse" />
                <div className="w-2/5 h-8 sm:h-10 lg:h-12 bg-white/10 rounded-lg mx-auto lg:mx-0 animate-pulse" />
              </div>
              <div className="w-full max-w-lg h-5 bg-white/10 rounded mx-auto lg:mx-0 mb-6 sm:mb-10 animate-pulse" />

              {/* App store buttons skeleton */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 mb-8 sm:mb-12">
                <div className="w-36 sm:w-44 h-14 bg-white/10 rounded-xl animate-pulse" />
                <div className="w-36 sm:w-44 h-14 bg-white/10 rounded-xl animate-pulse" />
              </div>

              {/* Stats skeleton */}
              <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-white/10">
                <div className="text-center lg:text-start">
                  <div className="w-12 h-8 bg-white/10 rounded mx-auto lg:mx-0 mb-1 animate-pulse" />
                  <div className="w-20 h-4 bg-white/10 rounded mx-auto lg:mx-0 animate-pulse" />
                </div>
                <div className="w-px h-10 sm:h-14 bg-white/10" />
                <div className="text-center lg:text-start">
                  <div className="w-14 h-8 bg-white/10 rounded mx-auto lg:mx-0 mb-1 animate-pulse" />
                  <div className="w-16 h-4 bg-white/10 rounded mx-auto lg:mx-0 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Phone mockup skeleton */}
            <div className="relative flex justify-center py-6 sm:py-10 lg:py-16">
              <div className="relative w-40 sm:w-52 lg:w-64 aspect-[9/18]">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2 animate-pulse">
                  <div className="w-full h-full bg-gray-700 rounded-[1.75rem] sm:rounded-[2.5rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
