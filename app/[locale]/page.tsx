'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Star,
  Search,
  ShoppingBag,
  Truck,
  Shield,
  Zap,
  TrendingUp,
  Play,
  X,
  Navigation2,
  Loader2,
  Home,
  Briefcase,
  MapPinned,
  CreditCard,
} from 'lucide-react';
import { clsx } from 'clsx';

import {
  Button,
  ShopCardSkeleton,
  CategorySkeleton,
  BannerSkeleton,
} from '@/components/ui';
import { ShopCard, CategoryCard } from '@/components/cards';
import { shopService } from '@/services';
import { Banner, Category, Shop, Story } from '@/types';
import { useSettingsStore, useLocationStore, useAuthStore } from '@/store';
import { demoBanners, demoCategories, demoShops, demoFamilyShops, demoStories } from '@/utils/demoData';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HomePage = () => {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const { location, isLoading: locationLoading, error: locationError, getCurrentLocation, setLocation, clearLocation } = useLocationStore();
  const { user } = useAuthStore();
  const isRTL = locale === 'ar';

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedShops, setRecommendedShops] = useState<Shop[]>([]);
  const [familyShops, setFamilyShops] = useState<Shop[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const locationPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Close location picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationPickerRef.current && !locationPickerRef.current.contains(event.target as Node)) {
        setShowLocationPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location && location.latitude !== 0 && location.longitude !== 0) {
      params.set('lat', location.latitude.toString());
      params.set('lng', location.longitude.toString());
    }
    router.push(`/shops${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Handle detect location
  const handleDetectLocation = async () => {
    await getCurrentLocation();
    setShowLocationPicker(false);
  };

  // Get location error message
  const getLocationErrorMessage = () => {
    switch (locationError) {
      case 'PERMISSION_DENIED':
        return tCommon('locationPermissionDenied');
      case 'POSITION_UNAVAILABLE':
        return tCommon('locationUnavailable');
      case 'TIMEOUT':
        return tCommon('locationTimeout');
      default:
        return tCommon('locationError');
    }
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        shopService.getBanners({ perPage: 10 }),
        shopService.getCategories({ perPage: 12 }),
        shopService.getRecommendedShops({ perPage: 8 }),
        shopService.getFamilyShops({ perPage: 8 }),
        shopService.getStories({ perPage: 20 }),
      ]);

      // Extract data from successful responses with demo fallback
      const [bannersRes, categoriesRes, recommendedRes, familyRes, storiesRes] = results;

      // Banners - use demo data if API fails or returns empty
      if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.length > 0) {
        setBanners(bannersRes.value.data);
      } else {
        setBanners(demoBanners);
      }

      // Categories - use demo data if API fails or returns empty
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.length > 0) {
        setCategories(categoriesRes.value.data);
      } else {
        setCategories(demoCategories);
      }

      // Recommended Shops - use demo data if API fails or returns empty
      if (recommendedRes.status === 'fulfilled' && recommendedRes.value.data?.length > 0) {
        setRecommendedShops(recommendedRes.value.data);
      } else {
        setRecommendedShops(demoShops);
      }

      // Family Shops - use demo data if API fails or returns empty
      if (familyRes.status === 'fulfilled' && familyRes.value.data?.length > 0) {
        setFamilyShops(familyRes.value.data);
      } else {
        setFamilyShops(demoFamilyShops);
      }

      // Stories - use demo data if API fails (stories are optional)
      if (storiesRes.status === 'fulfilled' && storiesRes.value.data?.length > 0) {
        setStories(storiesRes.value.data);
      } else {
        setStories(demoStories);
      }

      // Log any failures for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const endpoints = ['banners', 'categories', 'recommendedShops', 'familyShops', 'stories'];
            console.warn(`Using demo data for ${endpoints[index]} - API failed:`, result.reason?.message);
          }
        });
      }
    } catch (error) {
      // If everything fails, use demo data
      console.error('Error fetching home data, using demo data:', error);
      setBanners(demoBanners);
      setCategories(demoCategories);
      setRecommendedShops(demoShops);
      setFamilyShops(demoFamilyShops);
      setStories(demoStories);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[480px] lg:min-h-[540px] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233]">
          <div className="absolute top-20 start-10 w-72 h-72 bg-[var(--primary)]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 end-10 w-96 h-96 bg-[var(--primary-dark)]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="container relative z-10 py-10 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-white"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
                <span className="text-sm font-medium">{t('instantDeliveryBadge')}</span>
              </motion.div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] mb-4">
                <span className="block mb-1">{t('heroTitle')}</span>
                <span className="block bg-gradient-to-r from-[var(--primary)] via-[#ff6b3d] to-[var(--primary-light)] bg-clip-text text-transparent">
                  {t('heroTitleHighlight')}
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
                {t('heroSubtitle')}
              </p>

              {/* Search Bar with Location Picker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative max-w-xl my-10"
              >
                <form onSubmit={handleSearch}>
                  {/* Outer glow effect */}
                  <div className={clsx(
                    "absolute -inset-1 rounded-3xl transition-all duration-500 blur-lg opacity-0",
                    searchFocused && "opacity-100 bg-gradient-to-r from-[var(--primary)]/40 via-[#ff6b3d]/30 to-[var(--primary-light)]/40"
                  )} />
                  
                  <div className={clsx(
                    "relative flex items-center rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                    "bg-gradient-to-r from-white/[0.08] to-white/[0.04] backdrop-blur-xl",
                    searchFocused 
                      ? "border-[var(--primary)]/60 shadow-[0_8px_32px_rgba(255,61,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]" 
                      : "border-white/[0.12] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  )}>
                    {/* Location Picker Button */}
                    <div className="relative" ref={locationPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                        className={clsx(
                          "flex items-center gap-3 px-5 py-5 border-e border-white/10 transition-all duration-200 rounded-s-xl group",
                          showLocationPicker ? "bg-white/10" : "hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={clsx(
                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                            location 
                              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10" 
                              : "bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 group-hover:from-[var(--primary)]/30 group-hover:to-[var(--primary-light)]/20"
                          )}>
                            <MapPin size={20} className={location ? "text-green-400" : "text-[var(--primary-light)]"} />
                          </div>
                          {location && (
                            <span className="absolute -top-0.5 -end-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a3a4a] animate-pulse" />
                          )}
                        </div>
                        <div className="hidden sm:block text-start min-w-[100px] max-w-[130px]">
                          {location ? (
                            <>
                              <span className="text-[11px] text-green-400/80 font-medium uppercase tracking-wider block mb-1">{tCommon('yourLocation')}</span>
                              <span className="text-sm text-white font-semibold truncate block leading-tight">
                                {location.city || location.address?.split(',')[0] || tCommon('currentLocation')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider block mb-1">{tCommon('location')}</span>
                              <span className="text-sm text-white/70 font-medium block leading-tight">{tCommon('selectLocation')}</span>
                            </>
                          )}
                        </div>
                        <ChevronDown size={16} className={clsx(
                          "text-white/40 transition-transform duration-300 hidden sm:block ms-1",
                          showLocationPicker && "rotate-180 text-white/60"
                        )} />
                      </button>

                      {/* Location Picker Dropdown */}
                      <AnimatePresence>
                        {showLocationPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full start-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-gray-100/80 overflow-hidden z-50"
                          >
                            {/* Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                              <p className="text-sm font-semibold text-[var(--black)]">{tCommon('selectLocation')}</p>
                            </div>
                            
                            {/* Detect Location Button */}
                            <button
                              type="button"
                              onClick={handleDetectLocation}
                              disabled={locationLoading}
                              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--primary)]/5 transition-all duration-200 border-b border-gray-100 group"
                            >
                              <div className={clsx(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                                "bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 group-hover:from-[var(--primary)]/20 group-hover:to-[var(--primary)]/10"
                              )}>
                                {locationLoading ? (
                                  <Loader2 size={20} className="text-[var(--primary)] animate-spin" />
                                ) : (
                                  <Navigation2 size={20} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                                )}
                              </div>
                              <div className="text-start flex-1">
                                <p className="text-sm font-semibold text-[var(--black)] group-hover:text-[var(--primary)] transition-colors">
                                  {locationLoading ? tCommon('detectingLocation') : tCommon('detectLocation')}
                                </p>
                                <p className="text-xs text-[var(--text-grey)]">
                                  {tCommon('nearYou')}
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-gray-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Location Error */}
                            {locationError && (
                              <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <X size={12} className="text-red-500" />
                                </div>
                                <p className="text-xs text-red-600">{getLocationErrorMessage()}</p>
                              </div>
                            )}

                            {/* Current Location Display */}
                            {location && (
                              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50/50 border-b border-green-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <MapPinned size={14} className="text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-green-700 font-semibold">{tCommon('currentLocation')}</p>
                                    <p className="text-xs text-green-600 truncate">
                                      {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      clearLocation();
                                      setShowLocationPicker(false);
                                    }}
                                    className="text-xs text-green-700 hover:text-green-800 font-medium hover:underline"
                                  >
                                    {tCommon('changeLocation')}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Saved Addresses (for logged-in users) */}
                            {user?.addresses && user.addresses.length > 0 && (
                              <div className="py-2">
                                <p className="px-4 py-2 text-[10px] font-semibold text-[var(--text-grey)] uppercase tracking-wider">
                                  {tCommon('savedAddresses')}
                                </p>
                                {user.addresses.slice(0, 3).map((addr) => (
                                  <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => {
                                      if (addr.location) {
                                        setLocation({
                                          latitude: addr.location.latitude,
                                          longitude: addr.location.longitude,
                                          address: addr.address || '',
                                          city: addr.title || '',
                                        });
                                        setShowLocationPicker(false);
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                                      {addr.title?.toLowerCase().includes('home') || addr.title?.includes('منزل') ? (
                                        <Home size={16} className="text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
                                      ) : addr.title?.toLowerCase().includes('work') || addr.title?.includes('عمل') ? (
                                        <Briefcase size={16} className="text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
                                      ) : (
                                        <MapPin size={16} className="text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
                                      )}
                                    </div>
                                    <div className="text-start flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[var(--black)]">{addr.title}</p>
                                      <p className="text-xs text-[var(--text-grey)] truncate">{addr.address}</p>
                                    </div>
                                    {addr.active && (
                                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />

                    {/* Search Input */}
                    <div className="flex-1 relative min-w-0 px-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tCommon('searchPlaceholder')}
                        className={clsx(
                          "w-full px-4 py-5 bg-transparent text-white placeholder:text-white/40 focus:outline-none",
                          "text-[15px] font-medium"
                        )}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                      />
                    </div>

                    {/* Search Button */}
                    <div className="p-2.5 ps-1">
                      <Button 
                        type="submit" 
                        className={clsx(
                          "rounded-xl px-6 sm:px-8 py-3.5 font-semibold transition-all duration-300",
                          "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)]",
                          "shadow-[0_4px_20px_rgba(255,61,0,0.35)] hover:shadow-[0_6px_25px_rgba(255,61,0,0.45)]",
                          "hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        <span className="hidden sm:inline">{tCommon('search')}</span>
                        <Search size={20} className="sm:hidden" />
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Location Status Indicator (Mobile) */}
                {location && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sm:hidden mt-3 flex items-center gap-2 text-white/70"
                  >
                    <MapPinned size={14} className="text-green-400" />
                    <span className="text-xs truncate">
                      {location.city || location.address?.split(',')[0] || tCommon('locationSet')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="text-xs text-[var(--primary-light)] hover:underline"
                    >
                      {tCommon('changeLocation')}
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 sm:gap-10 mt-8"
              >
                {[
                  { value: '500+', label: t('stats.shops') },
                  { value: '50K+', label: t('stats.happyCustomers') },
                  { value: '100K+', label: t('stats.successfulOrders') },
                ].map((stat, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="absolute -start-3 sm:-start-5 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    )}
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-0.5">
                      {stat.value}
                    </p>
                    <p className="text-white/50 text-xs">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Banner Slider */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              {loading ? (
                <BannerSkeleton />
              ) : banners.length > 0 ? (
                <div className="relative">
                  <Swiper
                    modules={[Autoplay, Pagination, Navigation, EffectFade]}
                    spaceBetween={0}
                    slidesPerView={1}
                    effect="fade"
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                    pagination={{ 
                      clickable: true,
                      bulletClass: 'swiper-pagination-bullet !bg-white/30 !w-2 !h-2',
                      bulletActiveClass: '!bg-[var(--primary)] !w-6',
                    }}
                    navigation={{
                      prevEl: '.hero-prev',
                      nextEl: '.hero-next',
                    }}
                    loop
                    className="rounded-3xl overflow-hidden shadow-2xl"
                  >
                    {banners.map((banner) => (
                      <SwiperSlide key={banner.id}>
                        <Link href={banner.url || '#'} className="block aspect-[4/3] sm:aspect-[16/10] relative group">
                          <Image
                            src={banner.img}
                            alt={banner.translation?.title || 'Banner'}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          {banner.translation?.title && (
                            <div className="absolute bottom-6 start-6 end-6">
                              <p className="text-white text-xl font-bold drop-shadow-lg">
                                {banner.translation.title}
                              </p>
                            </div>
                          )}
                        </Link>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* Custom Navigation */}
                  <button className="hero-prev absolute start-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all">
                    {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                  </button>
                  <button className="hero-next absolute end-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all">
                    {isRTL ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                  </button>

                </div>
              ) : (
                <div className="aspect-[16/10] bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                  <p className="text-white/50">{t('noBanners')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 inset-x-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100L60 92C120 84 240 68 360 60C480 52 600 52 720 56C840 60 960 68 1080 72C1200 76 1320 76 1380 76L1440 76V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z"
              fill="var(--main-bg)"
            />
          </svg>
        </div>
      </section>

      {/* Stories Section */}
      {stories.length > 0 && (
        <section className="py-8 bg-[var(--main-bg)]">
          <div className="container">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full skeleton" />
                    </div>
                  ))
                : stories.map((story, index) => (
                    <motion.button
                      key={story.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setActiveStory(story)}
                      className="flex-shrink-0 group"
                    >
                      <div className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-[var(--primary)] via-[#ff6b3d] to-[var(--primary-light)]">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                          <div className="w-full h-full rounded-full overflow-hidden bg-[var(--main-bg)]">
                            {story.file_urls?.[0] && (
                              <Image
                                src={story.file_urls[0]}
                                alt=""
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                              />
                            )}
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -end-1 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-white">
                          <Play size={10} className="text-white fill-white ms-0.5" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="pt-12 pb-16 lg:pt-16 lg:pb-20 bg-[var(--main-bg)]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--black)] mb-2">
                {t('categories')}
              </h2>
              <p className="text-[var(--text-grey)]">{t('browseByCategory')}</p>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
            >
              {tCommon('viewAll')}
              {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 lg:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 lg:gap-6"
            >
              {categories.map((category) => (
                <motion.div key={category.id} variants={scaleIn}>
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Spacer between Categories and How It Works */}
      <div className="h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* How It Works Section */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-white via-[#fefefe] to-[#f8fafc] relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 start-10 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 end-10 w-80 h-80 bg-[#267881]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[var(--primary)]/3 to-[#267881]/3 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 text-[var(--primary)] text-sm font-bold rounded-full mb-6 border border-[var(--primary)]/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
              </span>
              {t('howItWorks.badge')}
            </motion.span>
            <h2 className="text-3xl lg:text-5xl font-bold text-[var(--black)]">
              {t('howItWorks.title')}
            </h2>
          </motion.div>

          {/* Spacer */}
          <div className="h-10 lg:h-16" aria-hidden="true" />

          {/* Steps Container */}
          <div className="relative">
            {/* Connecting Line - Desktop */}
            <div className="hidden lg:block absolute top-[140px] start-[12.5%] end-[12.5%] h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 via-[#4CAF50]/20 via-[#9C27B0]/20 to-[#267881]/20 rounded-full" />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[#4CAF50] via-[#9C27B0] to-[#267881] rounded-full origin-start"
                style={{ transformOrigin: isRTL ? 'right' : 'left' }}
              />
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-5 items-stretch"
            >
              {[
                {
                  step: '01',
                  icon: Search,
                  title: t('howItWorks.step1Title'),
                  description: t('howItWorks.step1Desc'),
                  color: '#FF3D00',
                  gradient: 'from-[#FF3D00] to-[#ff6b3d]',
                  bgGradient: 'from-[#FF3D00]/10 to-[#ff6b3d]/5',
                  delay: 0,
                },
                {
                  step: '02',
                  icon: ShoppingBag,
                  title: t('howItWorks.step2Title'),
                  description: t('howItWorks.step2Desc'),
                  color: '#4CAF50',
                  gradient: 'from-[#4CAF50] to-[#66BB6A]',
                  bgGradient: 'from-[#4CAF50]/10 to-[#66BB6A]/5',
                  delay: 0.15,
                },
                {
                  step: '03',
                  icon: CreditCard,
                  title: t('howItWorks.step3Title'),
                  description: t('howItWorks.step3Desc'),
                  color: '#9C27B0',
                  gradient: 'from-[#9C27B0] to-[#BA68C8]',
                  bgGradient: 'from-[#9C27B0]/10 to-[#BA68C8]/5',
                  delay: 0.3,
                },
                {
                  step: '04',
                  icon: Truck,
                  title: t('howItWorks.step4Title'),
                  description: t('howItWorks.step4Desc'),
                  color: '#267881',
                  gradient: 'from-[#267881] to-[#3a9aa3]',
                  bgGradient: 'from-[#267881]/10 to-[#3a9aa3]/5',
                  delay: 0.45,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: item.delay }}
                  className="relative group h-full"
                >
                  <div className="relative flex flex-col items-center text-center h-full">
                    {/* Step Number Circle */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: item.delay + 0.2, type: "spring", stiffness: 200 }}
                      className="relative z-10 mb-6 flex-shrink-0"
                    >
                      {/* Outer Ring */}
                      <div className={`absolute -inset-3 bg-gradient-to-br ${item.bgGradient} rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Animated Ring */}
                      <div className={`absolute -inset-2 rounded-full border-2 border-dashed opacity-30 group-hover:opacity-60 transition-opacity duration-300`} style={{ borderColor: item.color }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="w-full h-full"
                        />
                      </div>
                      
                      {/* Main Circle */}
                      <div 
                        className={`relative w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}
                        style={{ boxShadow: `0 20px 40px ${item.color}30` }}
                      >
                        {/* Inner Glow */}
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Icon */}
                        <item.icon size={36} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        
                        {/* Step Badge */}
                        <div className="absolute -top-1 -end-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border-2" style={{ borderColor: item.color }}>
                          <span className="text-xs font-bold" style={{ color: item.color }}>{item.step}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Content Card */}
                    <div className="relative w-full flex-1 flex flex-col">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                      
                      <div className="relative bg-white rounded-2xl p-6 lg:p-7 border border-[var(--border)] group-hover:border-transparent shadow-sm group-hover:shadow-xl transition-all duration-500 flex-1 flex flex-col">
                        {/* Decorative Corner */}
                        <div 
                          className="absolute top-0 end-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.color} 0%, transparent 60%)`,
                            borderRadius: '0 16px 0 100%'
                          }}
                        />
                        
                        <h3 className="text-lg lg:text-xl font-bold text-[var(--black)] mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" style={{ '--hover-gradient': `linear-gradient(135deg, ${item.color}, ${item.color}dd)` } as React.CSSProperties}>
                          <span className="group-hover:hidden">{item.title}</span>
                          <span className={`hidden group-hover:inline bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.title}</span>
                        </h3>
                        <p className="text-[var(--text-grey)] leading-relaxed text-sm lg:text-base">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Connector */}
                  {index < 3 && (
                    <div className="sm:hidden flex justify-center py-4">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: item.delay + 0.3 }}
                        className="w-1 h-10 rounded-full"
                        style={{ 
                          background: `linear-gradient(to bottom, ${item.color}, ${[
                            { color: '#4CAF50' },
                            { color: '#9C27B0' },
                            { color: '#267881' },
                            { color: '#267881' }
                          ][index + 1].color})` 
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-10 lg:mt-12"
          >
            <Link href="/shops">
              <Button className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                {tCommon('startShopping')}
                {isRTL ? <ChevronLeft size={20} className="ms-2" /> : <ChevronRight size={20} className="ms-2" />}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Spacer between How It Works and Shops */}
      <div className="h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Recommended Shops Section */}
      <section className="py-12 lg:py-16 bg-[var(--main-bg)]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-8 lg:mb-10"
          >
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--black)]">
                {t('recommendedShops')}
              </h2>
            </div>
            <Link
              href="/shops"
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
            >
              {tCommon('viewAll')}
              {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShopCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
            >
              {recommendedShops.map((shop) => (
                <motion.div key={shop.id} variants={fadeInUp}>
                  <ShopCard shop={shop} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Spacer between Shops and Download App */}
      <div className="h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Download App Section */}
      <section className="py-16 lg:py-20 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 end-1/4 w-96 h-96 bg-[var(--primary-dark)]/20 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <span className="inline-block px-4 py-2 bg-white/10 text-[var(--primary-light)] text-sm font-semibold rounded-full mb-8">
                {t('app.badge')}
              </span>
              
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                {t('downloadApp')}
                <span className="block text-[var(--primary)] mt-2">{t('now')}</span>
              </h2>
              
              <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
                {t('downloadAppSubtitle')}. {t('downloadAppDescription')}
              </p>

              {/* App store buttons */}
              <div className="flex flex-wrap gap-5 mb-12">
                <a
                  href="#"
                  className="group flex items-center gap-4 min-w-[180px] px-6 py-4 bg-gradient-to-b from-gray-800 to-black text-white rounded-xl hover:from-gray-700 hover:to-gray-900 hover:scale-[1.03] transition-all duration-300 shadow-xl border border-gray-600/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 group-hover:scale-110 transition-transform">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <p className="text-[11px] text-gray-400 leading-tight">Download on the</p>
                    <p className="font-bold text-xl leading-tight">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="group flex items-center gap-4 min-w-[180px] px-6 py-4 bg-gradient-to-b from-gray-800 to-black text-white rounded-xl hover:from-gray-700 hover:to-gray-900 hover:scale-[1.03] transition-all duration-300 shadow-xl border border-gray-600/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-9 h-9 group-hover:scale-110 transition-transform">
                      <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/>
                      <path fill="#FBBC04" d="M17.556 8.307l-3.765 3.693 3.765 3.693 4.231-2.385c.474-.268.474-.948 0-1.216l-4.231-2.385z"/>
                      <path fill="#4285F4" d="M3.609 22.186L14.778 11.01l-3.765-3.693-7.404 14.87z"/>
                      <path fill="#34A853" d="M3.609 1.814l10.17 10.17 3.777-3.677L3.609 1.814z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <p className="text-[11px] text-gray-400 leading-tight">Get it on</p>
                    <p className="font-bold text-xl leading-tight">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-10 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white mb-1">4.9</p>
                  <div className="flex items-center gap-1 text-[var(--star)]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                  </div>
                </div>
                <div className="w-px h-14 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white mb-1">50K+</p>
                  <p className="text-sm text-gray-400">{tCommon('downloads')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center py-10 lg:py-16"
            >
              <div className="relative">
                <div className="relative w-52 lg:w-64 aspect-[9/18]">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)] rounded-[2.5rem] overflow-hidden relative">
                      <div className="absolute top-0 inset-x-0 flex justify-center pt-2">
                        <div className="w-24 h-6 bg-black rounded-full" />
                      </div>
                      <div className="flex flex-col items-center justify-center h-full">
                        <Image
                          src="/images/maksab.png"
                          alt="Maksab App"
                          width={120}
                          height={120}
                          className="mb-4"
                        />
                        <p className="text-white/70 text-sm">{t('title')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/4 -start-10 bg-white rounded-2xl p-4 shadow-2xl hidden lg:flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck size={22} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-grey)] mb-1">{t('app.onTheWay')}</p>
                    <p className="font-bold text-[var(--black)]">5 {t('app.minutes')}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-1/4 -end-10 bg-[var(--primary)] text-white rounded-2xl px-5 py-3 shadow-2xl hidden lg:block"
                >
                  <p className="text-sm font-bold mb-1">{t('app.discount')}</p>
                  <p className="text-xs text-white/70">{t('app.onFirstOrder')}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-6 start-1/2 -translate-x-1/2 bg-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3"
                >
                  <div className="flex -space-x-2 space-x-reverse">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] border-2 border-white"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-grey)]">+50K {t('stats.users')}</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setActiveStory(null)}
          >
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-4 end-4 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {activeStory.file_urls?.[0] && (
                <Image
                  src={activeStory.file_urls[0]}
                  alt=""
                  fill
                  className="object-cover"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
