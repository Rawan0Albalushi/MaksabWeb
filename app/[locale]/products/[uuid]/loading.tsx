export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Product Image Skeleton */}
      <div className="relative bg-white">
        {/* Back Button */}
        <div className="absolute top-4 start-4 z-10 w-10 h-10 bg-black/10 rounded-full animate-pulse" />
        
        {/* Main Image */}
        <div className="aspect-square sm:aspect-[4/3] lg:aspect-[16/9] max-h-[50vh] bg-gray-200 animate-pulse" />
      </div>

      {/* Product Info */}
      <div className="container py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            {/* Title & Price */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="text-end">
                <div className="h-7 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Rating & Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Extras Section */}
            <div className="mb-6">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="h-12 w-32 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-12 flex-1 bg-[var(--primary)]/20 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
