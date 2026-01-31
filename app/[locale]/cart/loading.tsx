export default function CartLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton - Matching actual cart page */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] relative overflow-hidden min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] flex flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex-1 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="h-8 sm:h-10 w-40 sm:w-48 bg-white/10 rounded-lg animate-pulse mb-2" />
              <div className="h-4 sm:h-5 w-28 sm:w-36 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 sm:w-28 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Cart Items - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Shop Card Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 sm:w-40 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Cart Items Skeleton */}
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 sm:p-5">
                <div className="flex gap-3 sm:gap-5">
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gray-100 rounded-xl animate-pulse shrink-0" />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="h-5 sm:h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2 sm:mb-3" />
                      <div className="flex gap-1.5">
                        <div className="h-6 w-16 bg-gray-100 rounded-md animate-pulse" />
                        <div className="h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="h-9 sm:h-11 w-28 sm:w-36 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 sm:p-5 lg:sticky lg:top-24">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Coupon Input Skeleton */}
              <div className="mb-5">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="flex gap-2">
                  <div className="h-11 sm:h-12 flex-1 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-11 sm:h-12 w-20 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>

              {/* Summary Details */}
              <div className="space-y-3 py-4 border-y border-gray-100">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Checkout Button */}
              <div className="h-14 w-full bg-gradient-to-r from-orange-200 to-orange-300 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
