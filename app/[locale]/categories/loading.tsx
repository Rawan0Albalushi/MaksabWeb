import { CategorySkeleton } from '@/components/ui';

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-6 sm:py-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container py-6 sm:py-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
