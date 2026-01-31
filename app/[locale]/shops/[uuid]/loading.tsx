export default function ShopDetailsLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Hero Header Skeleton - Matching actual shop page */}
      <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 animate-pulse" />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 animate-pulse" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 animate-pulse" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 animate-pulse hidden sm:block" />
            </div>
          </div>

          {/* Shop Info */}
          <div className="flex items-start gap-4 sm:gap-6 lg:gap-8">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl bg-white/20 animate-pulse" />
              {/* Status Badge */}
              <div className="absolute -bottom-1 -end-1 sm:-bottom-2 sm:-end-2 w-14 sm:w-16 h-5 sm:h-6 bg-green-500/50 rounded-full animate-pulse" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Verified Badge */}
              <div className="w-20 h-5 bg-white/20 rounded-full animate-pulse mb-2" />
              
              {/* Title */}
              <div className="h-6 sm:h-8 lg:h-9 w-3/4 bg-white/25 rounded-lg animate-pulse mb-2" />
              
              {/* Description */}
              <div className="h-4 sm:h-5 w-full max-w-md bg-white/15 rounded animate-pulse mb-4" />
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-7 sm:h-8 w-20 sm:w-24 bg-white/20 rounded-full animate-pulse" />
                <div className="h-7 sm:h-8 w-24 sm:w-28 bg-white/20 rounded-full animate-pulse" />
                <div className="h-7 sm:h-8 w-20 sm:w-24 bg-white/20 rounded-full animate-pulse hidden sm:block" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--main-bg)"/>
          </svg>
        </div>
      </div>

      {/* Categories & Search Bar Skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20 shadow-sm">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
            {/* Search */}
            <div className="h-10 sm:h-11 w-full max-w-xs bg-gray-100 rounded-xl animate-pulse" />
            
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 sm:h-10 w-20 sm:w-24 bg-gray-100 rounded-full animate-pulse shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="container px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="h-6 sm:h-7 w-28 sm:w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-16 sm:w-20 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100/50 shadow-sm h-full">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100/80 relative overflow-hidden">
                <div className="absolute inset-0 skeleton" />
              </div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-md w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-2/3 animate-pulse" />
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                  <div className="h-5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg w-16 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
