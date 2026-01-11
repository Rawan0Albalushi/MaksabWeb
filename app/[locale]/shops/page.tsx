'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Star,
  Clock,
  Navigation2,
  MapPinned,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

import { ShopCardSkeleton, EmptyState } from '@/components/ui';
import { ShopCard } from '@/components/cards';
import { AddressSelector } from '@/components/address';
import { shopService } from '@/services';
import { Shop, Category } from '@/types';
import { useLocationStore } from '@/store';

const ShopsPage = () => {
  const t = useTranslations('common');
  const tShop = useTranslations('shop');
  const searchParams = useSearchParams();
  const { 
    selectedAddress, 
    currentLocation,
    refreshTrigger,
    getCurrentLocation, 
    getLocationForApi,
    isLoading: locationLoading 
  } = useLocationStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
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
    fetchCategories();
  }, []);

  // Fetch shops when location or filters change
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const location = getLocationForApi();
      const params: Record<string, unknown> = { perPage: 20 };
      
      // Only add parameters that have actual values
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category_id = selectedCategory;
      if (filters.openNow) params.open = true;
      if (filters.freeDelivery) params.free_delivery = true;
      if (filters.rating) params.rating = filters.rating;
      if (sortBy === 'rating') params.sort = 'rating';

      // Always use nearby endpoint with location
      const response = await shopService.getNearbyShops(
        location.latitude, 
        location.longitude, 
        params
      );
      
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
  }, [searchQuery, selectedCategory, sortBy, filters, getLocationForApi]);

  // Fetch shops on mount and when filters change
  useEffect(() => {
    fetchShops();
  }, [selectedCategory, sortBy, filters, fetchShops]);

  // Refetch shops when location changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchShops();
    }
  }, [refreshTrigger, fetchShops]);

  const fetchCategories = async () => {
    try {
      const categoriesRes = await shopService.getCategories({ perPage: 20 });
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.warn('Could not load categories:', error);
      setCategories([]);
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

  // Get display location
  const displayLocation = selectedAddress?.title || 
    selectedAddress?.address?.split(',')[0] || 
    currentLocation?.city || 
    currentLocation?.address?.split(',')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="container">
          {/* Location Row */}
          <div className="flex items-center justify-between h-12 sm:h-14 border-b border-gray-100">
            {selectedAddress || currentLocation ? (
              <>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                    <MapPinned size={14} className="text-white sm:hidden" />
                    <MapPinned size={16} className="text-white hidden sm:block" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">{t('shopsNearYou')}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {displayLocation || t('currentLocation')}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="flex items-center gap-1 sm:gap-1.5 text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs sm:text-sm font-medium flex-shrink-0"
                  >
                    <Navigation2 size={12} className={clsx("sm:hidden", locationLoading && 'animate-spin')} />
                    <Navigation2 size={14} className={clsx("hidden sm:block", locationLoading && 'animate-spin')} />
                    <span className="hidden xs:inline">{t('changeLocation')}</span>
                    <ChevronDown size={14} className={clsx("transition-transform", showLocationPicker && "rotate-180")} />
                  </button>
                  
                  {/* Location Picker Dropdown */}
                  {showLocationPicker && (
                    <div className="absolute top-full end-0 mt-2 z-50">
                      <AddressSelector 
                        variant="compact" 
                        onAddressChange={() => setShowLocationPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex items-center gap-1.5 sm:gap-2 text-[var(--primary)]"
              >
                <Navigation2 size={14} className={clsx("sm:hidden", locationLoading && 'animate-spin')} />
                <Navigation2 size={16} className={clsx("hidden sm:block", locationLoading && 'animate-spin')} />
                <span className="text-xs sm:text-sm font-medium">
                  {locationLoading ? t('detectingLocation') : t('detectLocation')}
                </span>
              </button>
            )}
          </div>

          {/* Search Row */}
          <div className="py-2.5 sm:py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={16} className="absolute start-3 sm:start-4 top-1/2 -translate-y-1/2 text-gray-400 sm:hidden" />
                <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 hidden sm:block" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-11 ps-9 sm:ps-11 pe-3 sm:pe-4 bg-gray-100 rounded-lg sm:rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:bg-white transition-all"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters Bar - Always visible, compact */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20">
        <div className="container">
          <div className="flex items-center h-11 sm:h-12 gap-3 sm:gap-6 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Sort */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">ترتيب حسب</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs sm:text-sm font-semibold text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="recommended">الموصى به</option>
                <option value="rating">التقييم</option>
                <option value="delivery">وقت التوصيل</option>
                <option value="distance">الأقرب</option>
              </select>
            </div>

            <div className="w-px h-4 sm:h-5 bg-gray-200 shrink-0" />

            {/* Quick Filters */}
            <button
              onClick={() => setFilters({ ...filters, openNow: !filters.openNow })}
              className={clsx(
                'h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 shrink-0 transition-colors',
                filters.openNow 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Clock size={12} className="sm:hidden" />
              <Clock size={14} className="hidden sm:block" />
              <span>مفتوح</span>
            </button>

            <button
              onClick={() => setFilters({ ...filters, freeDelivery: !filters.freeDelivery })}
              className={clsx(
                'h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 shrink-0 transition-colors',
                filters.freeDelivery 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="text-sm sm:text-base">🚚</span>
              <span className="hidden sm:inline">توصيل مجاني</span>
              <span className="sm:hidden">مجاني</span>
            </button>

            <div className="w-px h-4 sm:h-5 bg-gray-200 shrink-0" />

            {/* Rating */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">التقييم</span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[4, 4.5, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? null : rating })}
                    className={clsx(
                      'h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1 transition-colors',
                      filters.rating === rating
                        ? 'bg-amber-400 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Star size={10} className={clsx("sm:hidden", filters.rating === rating && 'fill-current')} />
                    <Star size={12} className={clsx("hidden sm:block", filters.rating === rating && 'fill-current')} />
                    <span>{rating}+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <>
                <div className="w-px h-4 sm:h-5 bg-gray-200 shrink-0" />
                <button
                  onClick={clearFilters}
                  className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-0.5 sm:gap-1 shrink-0 transition-colors"
                >
                  <X size={12} className="sm:hidden" />
                  <X size={14} className="hidden sm:block" />
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
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={clsx(
                  'h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors',
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
                    'h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors',
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
      <div className="container pt-4 sm:pt-6 pb-10 sm:pb-16">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <p className="text-xs sm:text-sm text-gray-500">
            {loading ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                جاري البحث...
              </span>
            ) : (
              <span>
                <strong className="text-gray-900">{shops.length}</strong> متجر
                {displayLocation && (
                  <span className="text-gray-400"> بالقرب من {displayLocation}</span>
                )}
              </span>
            )}
          </p>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="py-8 sm:py-12">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
