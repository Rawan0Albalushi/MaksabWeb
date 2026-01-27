export default function CartLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4 sm:py-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="container py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mb-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm sticky top-24">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              
              <div className="space-y-3 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="h-12 w-full bg-[var(--primary)]/20 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
