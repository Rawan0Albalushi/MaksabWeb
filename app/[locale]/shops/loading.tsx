import { ShopCardSkeleton } from '@/components/ui';

export default function ShopsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header Skeleton - Matching actual shops page */}
      <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
          {/* Location Row Skeleton */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white/20 animate-pulse" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 sm:h-3.5 w-20 sm:w-24 bg-white/20 rounded animate-pulse" />
                <div className="h-4 sm:h-5 w-28 sm:w-36 bg-white/25 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 sm:h-10 w-28 sm:w-36 bg-white/20 rounded-lg sm:rounded-xl animate-pulse" />
          </div>

          {/* Title & Search Skeleton */}
          <div className="max-w-2xl lg:max-w-3xl mx-auto text-center mb-6 sm:mb-8 lg:mb-10">
            <div className="h-7 sm:h-8 lg:h-10 w-48 sm:w-64 mx-auto bg-white/20 rounded-lg animate-pulse mb-2 sm:mb-3 lg:mb-4" />
            <div className="h-4 sm:h-5 w-64 sm:w-80 mx-auto bg-white/15 rounded animate-pulse mb-4 sm:mb-6 lg:mb-8" />
            
            {/* Search Bar Skeleton */}
            <div className="relative px-2 sm:px-0">
              <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden">
                <div className="w-10 sm:w-12 lg:w-14 h-11 sm:h-12 lg:h-14 flex items-center justify-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex-1 h-11 sm:h-12 lg:h-14 bg-gray-100/50 animate-pulse" />
                <div className="h-8 sm:h-9 lg:h-11 w-16 sm:w-20 lg:w-24 me-1.5 sm:me-2 bg-gray-200 rounded-lg sm:rounded-xl lg:rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Stats Skeleton */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center gap-2 sm:gap-2.5 lg:gap-3 ${i === 3 ? 'hidden xs:flex' : ''}`}>
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 animate-pulse" />
                <div className="text-start">
                  <div className="h-5 sm:h-6 w-8 bg-white/25 rounded animate-pulse mb-1" />
                  <div className="h-2.5 sm:h-3 w-10 sm:w-12 bg-white/15 rounded animate-pulse" />
                </div>
                {i < (i === 3 ? 3 : 2) && <div className="w-px h-7 sm:h-8 lg:h-10 bg-white/20 ms-3 sm:ms-6 lg:ms-10" />}
              </div>
            ))}
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      {/* Categories Section Skeleton */}
      <div className="bg-gray-50 py-4 sm:py-5 lg:py-6">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
            <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-14 sm:w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
            <div className="flex items-stretch gap-2 sm:gap-2.5 lg:gap-3 pb-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[85px] lg:min-w-[100px] bg-white shadow-sm">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-3 sm:h-3.5 w-10 sm:w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Sort Bar Skeleton */}
      <div className="bg-white border-y border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20 shadow-sm">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16 gap-3 sm:gap-4">
            {/* Left Side - Filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 overflow-x-auto hide-scrollbar flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 sm:h-9 lg:h-10 w-16 sm:w-20 lg:w-24 bg-gray-100 rounded-lg sm:rounded-xl animate-pulse shrink-0" />
              ))}
            </div>
            
            {/* Right Side - Sort & View */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
              <div className="h-9 lg:h-10 w-28 lg:w-32 bg-gray-100 rounded-lg lg:rounded-xl animate-pulse hidden md:block" />
              <div className="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg animate-pulse" />
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-md sm:rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 xl:py-10">
        {/* Results Info Skeleton */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
          <div>
            <div className="h-5 sm:h-6 lg:h-7 w-28 sm:w-36 bg-gray-200 rounded animate-pulse mb-1 sm:mb-2" />
            <div className="h-4 sm:h-5 w-40 sm:w-52 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Shops Grid Skeleton */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
