'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { ShopCardSkeleton, EmptyState } from '@/components/ui';
import { ShopCard } from '@/components/cards';
import { shopService } from '@/services';
import { Shop } from '@/types';
import { useLocationStore } from '@/store';

const ShopsPage = () => {
  const t = useTranslations('common');
  const searchParams = useSearchParams();
  const { 
    selectedAddress, 
    currentLocation,
    refreshTrigger,
    getLocationForApi,
  } = useLocationStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get location from URL params on mount
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Fetch shops when location changes
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const location = getLocationForApi();
      const params: Record<string, unknown> = { perPage: 20 };
      
      if (searchQuery) params.search = searchQuery;

      const response = await shopService.getNearbyShops(
        location.latitude, 
        location.longitude, 
        params
      );
      
      setShops(response.data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      try {
        const params: Record<string, unknown> = { perPage: 20 };
        if (searchQuery) params.search = searchQuery;
        const response = await shopService.getShops(params);
        setShops(response.data || []);
      } catch {
        setShops([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, getLocationForApi]);

  // Fetch shops on mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Refetch shops when location changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchShops();
    }
  }, [refreshTrigger, fetchShops]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShops();
  };

  // Get display location
  const displayLocation = selectedAddress?.title || 
    selectedAddress?.address?.split(',')[0] || 
    currentLocation?.city || 
    currentLocation?.address?.split(',')[0];

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
        
        <div className="container relative z-10 flex flex-col items-center justify-center" style={{ padding: '48px 20px 32px 20px' }}>
          {/* Title & Search */}
          <div className="w-full max-w-2xl lg:max-w-3xl text-center" style={{ marginBottom: '24px' }}>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white" style={{ marginBottom: '12px', padding: '0 12px' }}>
              اكتشف أفضل المطاعم
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-white/80" style={{ marginBottom: '20px', padding: '0 16px' }}>
              استمتع بتجربة طعام مميزة من أشهر المطاعم القريبة منك
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative" style={{ padding: '0 8px' }}>
              <div className="flex items-center bg-white rounded-xl shadow-md overflow-hidden" style={{ padding: '4px 6px 4px 14px' }}>
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  style={{ padding: '12px 14px' }}
                />
                <button
                  type="submit"
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm rounded-lg transition-colors shrink-0"
                  style={{ padding: '10px 18px' }}
                >
                  بحث
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Spacer to increase orange area height */}
        <div className="h-8 sm:h-10 lg:h-12" />
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '20px 18px' }}>
        {/* Results Info */}
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
              جميع المطاعم
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

        {/* Shops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div style={{ padding: '48px 20px' }}>
            <EmptyState
              type="search"
              title="لا توجد مطاعم"
              description="جرب البحث في موقع آخر"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            {shops.map((shop, index) => (
              <div 
                key={shop.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <ShopCard shop={shop} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;
