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
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Truck,
  Store,
  ChevronRight,
  Filter,
  Grid3X3,
  LayoutList,
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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      const categoriesRes = await shopService.getCategories();
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

  const activeFiltersCount = [
    selectedCategory,
    sortBy !== 'recommended',
    filters.openNow,
    filters.freeDelivery,
    filters.rating,
  ].filter(Boolean).length;

  // Get display location
  const displayLocation = selectedAddress?.title || 
    selectedAddress?.address?.split(',')[0] || 
    currentLocation?.city || 
    currentLocation?.address?.split(',')[0];

  // Sort options
  const sortOptions = [
    { value: 'recommended', label: 'الموصى به', icon: Sparkles },
    { value: 'rating', label: 'الأعلى تقييماً', icon: Star },
    { value: 'delivery', label: 'الأسرع توصيلاً', icon: Clock },
    { value: 'distance', label: 'الأقرب', icon: Navigation2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-10 start-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-float hidden lg:block" />
        <div className="absolute bottom-10 end-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
          {/* Location Row */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8">
            {selectedAddress || currentLocation ? (
              <>
                <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <MapPinned size={16} className="text-white sm:hidden" />
                    <MapPinned size={20} className="text-white hidden sm:block lg:hidden" />
                    <MapPinned size={22} className="text-white hidden lg:block" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] sm:text-xs lg:text-sm text-white/70 font-medium">{t('shopsNearYou')}</span>
                    <span className="text-xs sm:text-sm lg:text-base font-bold text-white truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[250px] lg:max-w-none">
                      {displayLocation || t('currentLocation')}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Navigation2 size={14} className={clsx("sm:hidden", locationLoading && 'animate-spin')} />
                    <Navigation2 size={16} className={clsx("hidden sm:block", locationLoading && 'animate-spin')} />
                    <span className="hidden xs:inline sm:inline">{t('changeLocation')}</span>
                    <ChevronDown size={14} className={clsx("transition-transform duration-300 sm:hidden", showLocationPicker && "rotate-180")} />
                    <ChevronDown size={16} className={clsx("transition-transform duration-300 hidden sm:block", showLocationPicker && "rotate-180")} />
                  </button>
                  
                  {/* Location Picker Dropdown */}
                  {showLocationPicker && (
                    <div className="absolute top-full end-0 mt-2 sm:mt-3 z-50 animate-fade-in-down">
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
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg sm:rounded-xl text-white transition-all duration-300 shadow-lg"
              >
                <Navigation2 size={18} className={clsx("sm:hidden", locationLoading && 'animate-spin')} />
                <Navigation2 size={20} className={clsx("hidden sm:block", locationLoading && 'animate-spin')} />
                <span className="text-xs sm:text-sm lg:text-base font-medium">
                  {locationLoading ? t('detectingLocation') : t('detectLocation')}
                </span>
              </button>
            )}
          </div>

          {/* Title & Search */}
          <div className="max-w-2xl lg:max-w-3xl mx-auto text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
              اكتشف أفضل المطاعم
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-white/80 mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-0">
              استمتع بتجربة طعام مميزة من أشهر المطاعم القريبة منك
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative px-2 sm:px-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-center w-10 sm:w-12 lg:w-14 h-11 sm:h-12 lg:h-14">
                    <Search size={18} className="text-gray-400 sm:hidden" />
                    <Search size={20} className="text-gray-400 hidden sm:block lg:hidden" />
                    <Search size={22} className="text-gray-400 hidden lg:block" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 h-11 sm:h-12 lg:h-14 pe-2 sm:pe-4 bg-transparent text-xs sm:text-sm lg:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-8 sm:h-9 lg:h-11 px-4 sm:px-5 lg:px-6 me-1.5 sm:me-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs sm:text-sm lg:text-base rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg"
                  >
                    بحث
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-10">
            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <Store size={14} className="sm:hidden" />
                <Store size={16} className="hidden sm:block lg:hidden" />
                <Store size={18} className="hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">{loading ? '...' : shops.length}</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">مطعم</div>
              </div>
            </div>
            <div className="w-px h-7 sm:h-8 lg:h-10 bg-white/20" />
            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={14} className="sm:hidden" />
                <TrendingUp size={16} className="hidden sm:block lg:hidden" />
                <TrendingUp size={18} className="hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">{categories.length}</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">تصنيف</div>
              </div>
            </div>
            <div className="w-px h-7 sm:h-8 lg:h-10 bg-white/20 hidden xs:block" />
            <div className="hidden xs:flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <Truck size={14} className="sm:hidden" />
                <Truck size={16} className="hidden sm:block lg:hidden" />
                <Truck size={18} className="hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">30</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">دقيقة توصيل</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gray-50 py-4 sm:py-5 lg:py-6">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">التصنيفات</h2>
            <button className="flex items-center gap-1 text-[var(--primary)] text-xs sm:text-sm font-medium hover:underline">
              <span>عرض الكل</span>
              <ChevronRight size={14} className="rtl:rotate-180 sm:hidden" />
              <ChevronRight size={16} className="rtl:rotate-180 hidden sm:block" />
            </button>
          </div>
          
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
            <div className="flex items-stretch gap-2 sm:gap-2.5 lg:gap-3 pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={clsx(
                  'flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[85px] lg:min-w-[100px] transition-all duration-300',
                  selectedCategory === null
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md'
                )}
              >
                <div className={clsx(
                  'w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl lg:text-2xl',
                  selectedCategory === null ? 'bg-white/20' : 'bg-gray-100'
                )}>
                  🍽️
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold whitespace-nowrap">الكل</span>
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[85px] lg:min-w-[100px] transition-all duration-300',
                    selectedCategory === category.id
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md'
                  )}
                >
                  <div className={clsx(
                    'w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl lg:text-2xl overflow-hidden',
                    selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100'
                  )}>
                    {category.img ? (
                      <img src={category.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '🍔'
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs lg:text-sm font-semibold whitespace-nowrap line-clamp-1">
                    {category.translation?.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Sort Bar */}
      <div className="bg-white border-y border-gray-100 sticky top-14 sm:top-16 lg:top-20 z-20 shadow-sm">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16 gap-3 sm:gap-4">
            {/* Left Side - Filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 overflow-x-auto hide-scrollbar flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'h-8 sm:h-9 lg:h-10 px-2.5 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shrink-0 transition-all duration-300 border',
                  showFilters || hasActiveFilters
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <SlidersHorizontal size={14} className="sm:hidden" />
                <SlidersHorizontal size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">الفلاتر</span>
                {activeFiltersCount > 0 && (
                  <span className={clsx(
                    'w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center',
                    showFilters || hasActiveFilters ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary)] text-white'
                  )}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Quick Filters */}
              <button
                onClick={() => setFilters({ ...filters, openNow: !filters.openNow })}
                className={clsx(
                  'h-8 sm:h-9 lg:h-10 px-2.5 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 transition-all duration-300 border',
                  filters.openNow 
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <Clock size={13} className="sm:hidden" />
                <Clock size={15} className="hidden sm:block" />
                <span className="hidden xs:inline">مفتوح الآن</span>
                <span className="xs:hidden">مفتوح</span>
              </button>

              <button
                onClick={() => setFilters({ ...filters, freeDelivery: !filters.freeDelivery })}
                className={clsx(
                  'h-8 sm:h-9 lg:h-10 px-2.5 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 transition-all duration-300 border',
                  filters.freeDelivery 
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <Truck size={13} className="sm:hidden" />
                <Truck size={15} className="hidden sm:block" />
                <span className="hidden sm:inline">توصيل مجاني</span>
                <span className="sm:hidden">مجاني</span>
              </button>

              {/* Rating Buttons */}
              {[4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? null : rating })}
                  className={clsx(
                    'h-8 sm:h-9 lg:h-10 px-2.5 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all duration-300 border',
                    filters.rating === rating
                      ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <Star size={12} className={clsx("sm:hidden", filters.rating === rating && 'fill-current')} />
                  <Star size={14} className={clsx("hidden sm:block", filters.rating === rating && 'fill-current')} />
                  <span>{rating}+</span>
                </button>
              ))}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-8 sm:h-9 lg:h-10 px-2.5 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all duration-300 border border-red-100"
                >
                  <X size={13} className="sm:hidden" />
                  <X size={15} className="hidden sm:block" />
                  <span>مسح</span>
                </button>
              )}
            </div>

            {/* Right Side - Sort & View */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
              {/* Sort Dropdown */}
              <div className="relative hidden md:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 lg:h-10 ps-3 lg:ps-4 pe-8 lg:pe-10 appearance-none bg-white border border-gray-200 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium text-gray-700 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 cursor-pointer transition-all"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute end-2.5 lg:end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none lg:hidden" />
                <ChevronDown size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none hidden lg:block" />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-300',
                    viewMode === 'grid' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Grid3X3 size={14} className="sm:hidden" />
                  <Grid3X3 size={16} className="hidden sm:block" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-300',
                    viewMode === 'list' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <LayoutList size={14} className="sm:hidden" />
                  <LayoutList size={16} className="hidden sm:block" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-gray-100 animate-fade-in-down">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {/* Sort Options */}
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2 font-medium">الترتيب</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {sortOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={clsx(
                            'h-8 sm:h-9 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all duration-300 border',
                            sortBy === option.value
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Icon size={13} className="sm:hidden" />
                          <Icon size={15} className="hidden sm:block" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 xl:py-10">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.translation?.title 
                : 'جميع المطاعم'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {loading ? (
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  جاري البحث...
                </span>
              ) : (
                <span>
                  تم العثور على <strong className="text-gray-900">{shops.length}</strong> مطعم
                  {displayLocation && (
                    <span className="text-gray-400"> بالقرب من {displayLocation}</span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Shops Grid/List */}
        {loading ? (
          <div className={clsx(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6'
              : 'flex flex-col gap-3 sm:gap-4'
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="py-10 sm:py-12 lg:py-16">
            <EmptyState
              type="search"
              title="لا توجد مطاعم"
              description="جرب تغيير معايير البحث أو الفلاتر للعثور على نتائج"
              action={{
                label: 'مسح جميع الفلاتر',
                onClick: clearFilters,
              }}
            />
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6'
              : 'flex flex-col gap-3 sm:gap-4'
          )}>
            {shops.map((shop, index) => (
              <div 
                key={shop.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <ShopCard 
                  shop={shop} 
                  variant={viewMode === 'list' ? 'horizontal' : 'default'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;
