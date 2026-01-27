import { ShopCardSkeleton } from '@/components/ui';

export default function ShopsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header Skeleton */}
      <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
        <div className="container py-8 sm:py-12 lg:py-16">
          {/* Location Row Skeleton */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
          </div>

          {/* Title & Search Skeleton */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="h-8 sm:h-10 w-64 mx-auto bg-white/20 rounded-lg animate-pulse mb-4" />
            <div className="h-4 w-80 mx-auto bg-white/20 rounded animate-pulse mb-6" />
            
            {/* Search Bar Skeleton */}
            <div className="h-12 sm:h-14 w-full bg-white rounded-2xl sm:rounded-3xl animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 animate-pulse" />
                <div className="flex flex-col gap-1">
                  <div className="h-5 w-8 bg-white/20 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-gray-50 pt-2 pb-4 sm:pb-6">
        <div className="container">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="flex items-stretch gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl min-w-[80px] sm:min-w-[100px] bg-white">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar Skeleton */}
      <div className="bg-white border-y border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 sm:h-10 w-20 sm:w-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse hidden sm:block" />
              <div className="h-10 w-20 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container py-6 sm:py-8 lg:py-10">
        {/* Results Info Skeleton */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Shops Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
