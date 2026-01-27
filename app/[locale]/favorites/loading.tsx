import { ShopCardSkeleton } from '@/components/ui';

export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4 sm:py-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center gap-4 py-3">
            <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
