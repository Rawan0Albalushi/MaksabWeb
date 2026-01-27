export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4 sm:py-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center gap-2 py-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Skeleton */}
      <div className="container py-6 sm:py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>

              {/* Order Items */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>

              {/* Order Footer */}
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
