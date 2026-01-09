'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Star,
  Clock,
  Navigation2,
  MapPinned,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, ShopCardSkeleton, EmptyState } from '@/components/ui';
import { ShopCard, CategoryCard } from '@/components/cards';
import { shopService } from '@/services';
import { Shop, Category } from '@/types';
import { useLocationStore } from '@/store';

const ShopsPage = () => {
  const t = useTranslations('common');
  const tShop = useTranslations('shop');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { location, getCurrentLocation, isLoading: locationLoading } = useLocationStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState({
    openNow: false,
    freeDelivery: false,
    rating: null as number | null,
  });

  // Get location from URL params on mount
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [selectedCategory, sortBy, filters, location]);

  const fetchData = async () => {
    try {
      const categoriesRes = await shopService.getCategories({ perPage: 20 });
      setCategories(categoriesRes.data || []);
    } catch (error) {
      // Silently handle error - categories are optional for the page to function
      console.warn('Could not load categories:', error);
      setCategories([]);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { perPage: 20 };
      
      // Only add parameters that have actual values
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category_id = selectedCategory;
      if (filters.openNow) params.open = true;
      if (filters.freeDelivery) params.free_delivery = true;
      if (filters.rating) params.rating = filters.rating;
      if (sortBy === 'rating') params.sort = 'rating';

      let response;
      
      // Use nearby endpoint if location is available with valid coordinates
      if (location && location.latitude !== 0 && location.longitude !== 0) {
        response = await shopService.getNearbyShops(location.latitude, location.longitude, params);
      } else {
        response = await shopService.getShops(params);
      }
      
      setShops(response.data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      // Fallback to regular shops if nearby fails
      try {
        const params: Record<string, unknown> = { perPage: 20 };
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category_id = selectedCategory;
        const response = await shopService.getShops(params);
        setShops(response.data || []);
      } catch {
        setShops([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShops();
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSortBy('recommended');
    setFilters({
      openNow: false,
      freeDelivery: false,
      rating: null,
    });
  };

  const hasActiveFilters =
    selectedCategory || sortBy !== 'recommended' || filters.openNow || filters.freeDelivery || filters.rating;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="container">
          {/* Location Row */}
          <div className="flex items-center justify-between h-14 border-b border-gray-100">
            {location ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                    <MapPinned size={16} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{t('shopsNearYou')}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {location.city || location.address?.split(',')[0] || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
                >
                  <Navigation2 size={14} className={locationLoading ? 'animate-spin' : ''} />
                  <span>{t('changeLocation')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 text-[var(--primary)]"
              >
                <Navigation2 size={16} className={locationLoading ? 'animate-spin' : ''} />
                <span className="text-sm font-medium">
                  {locationLoading ? t('detectingLocation') : t('detectLocation')}
                </span>
              </button>
            )}
          </div>

          {/* Search Row */}
          <div className="py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 ps-11 pe-4 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:bg-white transition-all"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters Bar - Always visible, compact */}
      <div className="bg-white border-b border-gray-100 sticky top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center h-12 gap-6 overflow-x-auto hide-scrollbar">
            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">ترتيب حسب</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-2 text-sm font-semibold text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="recommended">الموصى به</option>
                <option value="rating">التقييم</option>
                <option value="delivery">وقت التوصيل</option>
                <option value="distance">الأقرب</option>
              </select>
            </div>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Quick Filters */}
            <button
              onClick={() => setFilters({ ...filters, openNow: !filters.openNow })}
              className={clsx(
                'h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors',
                filters.openNow 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Clock size={14} />
              <span>مفتوح الآن</span>
            </button>

            <button
              onClick={() => setFilters({ ...filters, freeDelivery: !filters.freeDelivery })}
              className={clsx(
                'h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors',
                filters.freeDelivery 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>🚚</span>
              <span>توصيل مجاني</span>
            </button>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Rating */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">التقييم</span>
              <div className="flex items-center gap-1">
                {[4, 4.5, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? null : rating })}
                    className={clsx(
                      'h-8 px-2.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                      filters.rating === rating
                        ? 'bg-amber-400 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Star size={12} className={filters.rating === rating ? 'fill-current' : ''} />
                    <span>+{rating}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <>
                <div className="w-px h-5 bg-gray-200 shrink-0" />
                <button
                  onClick={clearFilters}
                  className="h-8 px-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <X size={14} />
                  <span>مسح</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-100">
        <div className="container">
          <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 py-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={clsx(
                  'h-9 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
                  selectedCategory === null
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                الكل
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'h-9 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
                    selectedCategory === category.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category.translation?.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container pt-6 pb-16">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                جاري البحث...
              </span>
            ) : (
              <span>
                <strong className="text-gray-900">{shops.length}</strong> متجر
              </span>
            )}
          </p>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="py-12">
            <EmptyState
              type="search"
              title="لا توجد متاجر"
              description="جرب تغيير معايير البحث أو الفلاتر"
              action={{
                label: 'مسح الفلاتر',
                onClick: clearFilters,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;

