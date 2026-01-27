export default function OrderDetailsLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-[var(--primary)]/20 rounded-full animate-pulse" />
            </div>

            {/* Status Timeline */}
            <div className="flex items-center justify-between relative">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 z-10">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100" />
            </div>
          </div>

          {/* Shop Info */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="text-end">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
