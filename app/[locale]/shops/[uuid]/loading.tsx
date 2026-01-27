import { ProductCardSkeleton } from '@/components/ui';

export default function ShopDetailsLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Shop Header Skeleton */}
      <div className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 start-4 w-10 h-10 bg-white/20 rounded-full animate-pulse" />
        
        {/* Shop Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6">
          <div className="container">
            <div className="flex items-end gap-4">
              {/* Shop Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl animate-pulse shadow-xl" />
              
              {/* Shop Info */}
              <div className="flex-1 pb-1">
                <div className="h-6 sm:h-8 w-48 bg-white/30 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-white/20 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-3">
                  <div className="h-6 w-16 bg-white/20 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-white/20 rounded-full animate-pulse" />
                  <div className="h-6 w-24 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs Skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="container py-6 sm:py-8">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
