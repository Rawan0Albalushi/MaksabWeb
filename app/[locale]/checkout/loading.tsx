export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse" />
                    <div className="w-10 h-6 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm sticky top-24">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              
              {/* Items */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
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
