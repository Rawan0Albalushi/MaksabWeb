export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching actual checkout page */}
      <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] relative overflow-hidden min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex-1 flex items-center" style={{ paddingTop: '90px' }}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Back Button */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 animate-pulse" />
              
              <div>
                <div className="h-7 sm:h-9 lg:h-10 w-32 sm:w-40 bg-white/15 rounded-lg animate-pulse mb-1 sm:mb-2" />
                <div className="h-4 sm:h-5 w-48 sm:w-56 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Security Badge */}
            <div className="hidden sm:flex h-9 w-36 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#F4F4F4" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form Section - 3 columns */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100/80 bg-gradient-to-r from-gray-100/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Content Sections */}
              <div className="p-5 space-y-6">
                {/* Delivery Type */}
                <div>
                  <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                </div>
                
                {/* Address */}
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                </div>
                
                {/* Delivery Time */}
                <div>
                  <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                </div>
                
                {/* Payment Method */}
                <div>
                  <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary - 2 columns */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-24">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Items */}
              <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-14 bg-gray-100 rounded animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
              
              {/* Coupon */}
              <div className="mb-5">
                <div className="flex gap-2">
                  <div className="h-11 flex-1 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-11 w-20 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>
              
              {/* Totals */}
              <div className="space-y-3 py-4 border-y border-gray-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="flex justify-between items-center py-4">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Submit Button */}
              <div className="h-14 w-full bg-gradient-to-r from-orange-200 to-orange-300 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
