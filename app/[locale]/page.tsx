'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Search,
  ShoppingBag,
  Truck,
  Play,
  X,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';

import {
  ShopCardSkeleton,
  CategorySkeleton,
  BannerSkeleton,
} from '@/components/ui';
import { ShopCard, CategoryCard } from '@/components/cards';
import { AddressSelector } from '@/components/address';
import { Footer } from '@/components/layout';
import { shopService } from '@/services';
import { Banner, Category, Shop, Story } from '@/types';
import { useSettingsStore, useLocationStore, useAuthStore } from '@/store';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HomePage = () => {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const { locale } = useSettingsStore();
  const { selectedAddress, refreshTrigger, currentLocation, _hasHydrated } = useLocationStore();
  const { user } = useAuthStore();
  const isRTL = locale === 'ar';

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedShops, setRecommendedShops] = useState<Shop[]>([]);
  const [familyShops, setFamilyShops] = useState<Shop[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  // Fetch home data (banners, categories, stories - not location dependent)
  const fetchStaticData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        shopService.getBanners({ perPage: 10 }),
        shopService.getCategoriesPaginate({ perPage: 20, type: 'main' }), // Gets main categories with pagination
        shopService.getStories({ perPage: 20 }),
      ]);

      const [bannersRes, categoriesRes, storiesRes] = results;

      // Banners
      if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.length > 0) {
        setBanners(bannersRes.value.data);
      }

      // Categories - Debug logging
      console.log('Categories Response:', categoriesRes);
      if (categoriesRes.status === 'fulfilled') {
        console.log('Categories Data:', categoriesRes.value);
        if (categoriesRes.value.data?.length > 0) {
          setCategories(categoriesRes.value.data);
        } else {
          console.warn('Categories API returned empty data');
        }
      } else {
        console.error('Categories API failed:', categoriesRes.reason);
      }

      // Stories
      if (storiesRes.status === 'fulfilled' && storiesRes.value.data?.length > 0) {
        setStories(storiesRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching static data:', error);
    }
  }, []);

  // Fetch shops (location dependent)
  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      // Get location from state - priority: selectedAddress > currentLocation > default
      let lat: number, lng: number;
      
      if (selectedAddress?.location) {
        lat = selectedAddress.location.latitude;
        lng = selectedAddress.location.longitude;
      } else if (currentLocation) {
        lat = currentLocation.latitude;
        lng = currentLocation.longitude;
      } else {
        // Default location (Muscat, Oman)
        lat = 23.5880;
        lng = 58.3829;
      }
      
      console.log('📍 Fetching shops with location:', { lat, lng, selectedAddress: selectedAddress?.title });
      
      const results = await Promise.allSettled([
        shopService.getNearbyShops(lat, lng, { perPage: 8 }),
        shopService.getFamilyShops(lat, lng, { perPage: 8 }),
      ]);

      const [recommendedRes, familyRes] = results;

      // Recommended Shops - always update, even if empty
      if (recommendedRes.status === 'fulfilled') {
        setRecommendedShops(recommendedRes.value.data || []);
      }

      // Family Shops - always update, even if empty
      if (familyRes.status === 'fulfilled') {
        setFamilyShops(familyRes.value.data || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setShopsLoading(false);
    }
  }, [selectedAddress, currentLocation]);

  // Initial data fetch - wait for hydration before fetching shops
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      // Fetch static data immediately
      await fetchStaticData();
      
      // Only fetch shops after hydration is complete
      if (_hasHydrated) {
        console.log('📍 Initial fetch - hydrated, selectedAddress:', selectedAddress?.title);
        await fetchShops();
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [fetchStaticData, fetchShops, _hasHydrated, selectedAddress]);

  // Fetch shops when hydration completes (for the first time)
  useEffect(() => {
    if (_hasHydrated && !loading) {
      console.log('📍 Hydration complete, fetching shops with address:', selectedAddress?.title);
      fetchShops();
    }
  }, [_hasHydrated]);

  // Refetch shops when location changes
  useEffect(() => {
    if (refreshTrigger > 0 && _hasHydrated) {
      console.log('🔄 Location changed, refreshTrigger:', refreshTrigger);
      fetchShops();
    }
  }, [refreshTrigger, fetchShops, _hasHydrated]);


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
    <div className="min-h-screen overflow-x-hidden bg-[var(--black)]">
      {/* Hero Section */}
      <section className="relative min-h-[auto] sm:min-h-[420px] lg:min-h-[480px] flex items-start sm:items-center z-[100]">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] overflow-hidden">
          <div className="absolute top-10 sm:top-20 start-5 sm:start-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary)]/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-20 sm:bottom-24 end-5 sm:end-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary-dark)]/30 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
          
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container relative z-10 sm:pt-6 sm:pb-6 lg:py-10" style={{ paddingTop: '70px', paddingBottom: '40px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-white text-center lg:text-start flex flex-col items-center lg:items-start gap-2 sm:gap-0"
            >

              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] sm:leading-[1.2]">
                <span className="block mb-0.5 sm:mb-1">{t('heroTitle')}</span>
                <span className="block bg-gradient-to-r from-[var(--primary)] via-[#ff6b3d] to-[var(--primary-light)] bg-clip-text text-transparent">
                  {t('heroTitleHighlight')}
                </span>
              </h1>

              {/* Spacer after Title */}
              <div className="h-1.5 sm:h-3" aria-hidden="true" />
              
              <p className="text-xs sm:text-base md:text-lg text-white/70 max-w-lg mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
                {t('heroSubtitle')}
              </p>

              {/* Spacer after Description */}
              <div className="h-2 sm:h-4" aria-hidden="true" />

              {/* Location Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative max-w-md mx-auto lg:mx-0 z-[60] w-full px-1 sm:px-0"
              >
                {/* Outer glow effect */}
                <div className="absolute -inset-1 rounded-xl sm:rounded-2xl transition-all duration-500 blur-lg opacity-50 bg-gradient-to-r from-[var(--primary)]/30 via-[#ff6b3d]/20 to-[var(--primary-light)]/30" />
                
                <div className={clsx(
                  "relative flex items-center rounded-xl sm:rounded-2xl border transition-all duration-300",
                  "bg-gradient-to-r from-white/[0.08] to-white/[0.04] backdrop-blur-xl",
                  "border-white/[0.12] hover:border-[var(--primary)]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_32px_rgba(255,61,0,0.15)]"
                )}>
                  {/* Address Selector Component - Full Width */}
                  <AddressSelector variant="hero" fullWidth />
                </div>
              </motion.div>

              {/* Spacer before Stats */}
              <div className="h-3 sm:h-5" aria-hidden="true" />

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center lg:justify-start gap-4 sm:gap-10"
              >
                {[
                  { value: '500+', label: t('stats.shops') },
                  { value: '50K+', label: t('stats.happyCustomers') },
                  { value: '100K+', label: t('stats.successfulOrders') },
                ].map((stat, index) => (
                  <div key={index} className="relative text-center lg:text-start">
                    {index > 0 && (
                      <div className="absolute -start-2 sm:-start-5 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    )}
                    <p className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-0.5">
                      {stat.value}
                    </p>
                    <p className="text-white/50 text-[9px] sm:text-xs">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Banner Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative mt-4 lg:mt-0"
            >
              {loading ? (
                <BannerSkeleton />
              ) : banners.length > 0 ? (
                <div className="relative group/banner">
                  {/* Main banner container */}
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl">
                    
                    <Swiper
                      modules={[Autoplay, Pagination, Navigation, EffectFade]}
                      spaceBetween={0}
                      slidesPerView={1}
                      effect="fade"
                      autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                      pagination={{ 
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-2 !h-2 sm:!w-2.5 sm:!h-2.5 !mx-1 !transition-all !duration-300 hover:!bg-white/80',
                        bulletActiveClass: '!bg-white !w-6 sm:!w-8 !rounded-full',
                      }}
                      navigation={{
                        prevEl: '.hero-prev',
                        nextEl: '.hero-next',
                      }}
                      loop
                      className="overflow-hidden"
                    >
                      {banners.map((banner, index) => (
                        <SwiperSlide key={banner.id}>
                          <Link 
                            href={banner.url || '#'} 
                            className="block relative group"
                          >
                            {/* Banner Image with bounce animation */}
                            <div className="animate-[banner-bounce_3s_ease-in-out_infinite]">
                              <Image
                                src={banner.img}
                                alt={banner.translation?.title || 'Banner'}
                                width={800}
                                height={400}
                                className="w-full h-auto rounded-xl sm:rounded-2xl lg:rounded-3xl transition-transform duration-500 group-hover:scale-[1.02]"
                                priority={index === 0}
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>

                            {/* Slide indicator */}
                            <div className="absolute top-3 sm:top-4 end-3 sm:end-4 flex items-center gap-1.5 z-10">
                              <span className="text-white text-[10px] sm:text-xs font-semibold bg-black/40 backdrop-blur-md rounded-full" style={{ padding: '6px 12px' }}>
                                {index + 1}/{banners.length}
                              </span>
                            </div>
                          </Link>
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    {/* Custom Navigation */}
                    <button className="hero-prev absolute start-2 sm:start-3 lg:start-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover/banner:opacity-100" style={{ padding: '8px' }}>
                      {isRTL ? <ChevronRight size={16} className="text-[var(--black)] sm:hidden" /> : <ChevronLeft size={16} className="text-[var(--black)] sm:hidden" />}
                      {isRTL ? <ChevronRight size={20} className="text-[var(--black)] hidden sm:block lg:hidden" /> : <ChevronLeft size={20} className="text-[var(--black)] hidden sm:block lg:hidden" />}
                      {isRTL ? <ChevronRight size={24} className="text-[var(--black)] hidden lg:block" /> : <ChevronLeft size={24} className="text-[var(--black)] hidden lg:block" />}
                    </button>
                    <button className="hero-next absolute end-2 sm:end-3 lg:end-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover/banner:opacity-100" style={{ padding: '8px' }}>
                      {isRTL ? <ChevronLeft size={16} className="text-[var(--black)] sm:hidden" /> : <ChevronRight size={16} className="text-[var(--black)] sm:hidden" />}
                      {isRTL ? <ChevronLeft size={20} className="text-[var(--black)] hidden sm:block lg:hidden" /> : <ChevronRight size={20} className="text-[var(--black)] hidden sm:block lg:hidden" />}
                      {isRTL ? <ChevronLeft size={24} className="text-[var(--black)] hidden lg:block" /> : <ChevronRight size={24} className="text-[var(--black)] hidden lg:block" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--primary-dark)]/10 rounded-2xl sm:rounded-3xl blur-xl" />
                  <div className="relative aspect-[16/9] sm:aspect-[16/10] bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl" style={{ padding: '24px' }}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4" style={{ padding: '16px' }}>
                      <ShoppingBag size={32} className="text-white/40" />
                    </div>
                    <p className="text-white/50 text-sm sm:text-base" style={{ padding: '8px 16px' }}>{t('noBanners')}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-6 sm:h-10 lg:h-[50px]"
            preserveAspectRatio="none"
          >
            <path
              d="M0 50L60 46C120 42 240 34 360 30C480 26 600 26 720 28C840 30 960 34 1080 36C1200 38 1320 38 1380 38L1440 38V50H1380C1320 50 1200 50 1080 50C960 50 840 50 720 50C600 50 480 50 360 50C240 50 120 50 60 50H0Z"
              fill="var(--main-bg)"
            />
          </svg>
        </div>
      </section>

      {/* Categories Section - Hidden */}
      {/* 
      <section className="pt-6 pb-8 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 bg-[var(--main-bg)]">
        <div className="container">
          <div className="flex items-center justify-between mb-5 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--black)] mb-1 sm:mb-2">
                {t('categories')}
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-grey)]">{t('browseByCategory')}</p>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
            >
              {tCommon('viewAll')}
              {isRTL ? <ChevronLeft size={14} className="sm:hidden" /> : <ChevronRight size={14} className="sm:hidden" />}
              {isRTL ? <ChevronLeft size={16} className="hidden sm:block" /> : <ChevronRight size={16} className="hidden sm:block" />}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 lg:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-grey)]">لا توجد تصنيفات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 lg:gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>
      */}

      {/* Stories Section */}
      {stories.length > 0 && (
        <section className="py-4 sm:py-8 bg-[var(--main-bg)]">
          <div className="container">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full skeleton" />
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
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] bg-gradient-to-br from-[var(--primary)] via-[#ff6b3d] to-[var(--primary-light)]">
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
                        <div className="absolute -bottom-0.5 -end-0.5 sm:-bottom-1 sm:-end-1 w-5 h-5 sm:w-6 sm:h-6 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-white">
                          <Play size={8} className="text-white fill-white ms-0.5 sm:hidden" />
                          <Play size={10} className="text-white fill-white ms-0.5 hidden sm:block" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Spacer between Stories and How It Works */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* How It Works Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-white via-[#fefefe] to-[#f8fafc] relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 sm:top-20 start-5 sm:start-10 w-40 sm:w-64 h-40 sm:h-64 bg-[var(--primary)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 sm:bottom-20 end-5 sm:end-10 w-48 sm:w-80 h-48 sm:h-80 bg-[#267881]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-gradient-to-br from-[var(--primary)]/3 to-[#267881]/3 rounded-full blur-[60px] sm:blur-[100px]" />
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
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 text-[var(--primary)] text-xs sm:text-sm font-bold rounded-full mb-4 sm:mb-6 border border-[var(--primary)]/20"
              style={{ padding: '8px 16px' }}
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[var(--primary)]"></span>
              </span>
              {t('howItWorks.badge')}
            </motion.span>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-[var(--black)]">
              {t('howItWorks.title')}
            </h2>
          </motion.div>

          {/* Spacer */}
          <div className="h-6 sm:h-10 lg:h-16" aria-hidden="true" />

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
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-5 items-stretch"
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
              ].map((item) => (
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
                      className="relative z-10 mb-3 sm:mb-6 flex-shrink-0"
                    >
                      {/* Outer Ring */}
                      <div className={`absolute -inset-2 sm:-inset-3 bg-gradient-to-br ${item.bgGradient} rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Animated Ring - Hidden on mobile */}
                      <div className={`absolute -inset-1.5 sm:-inset-2 rounded-full border-2 border-dashed opacity-30 group-hover:opacity-60 transition-opacity duration-300 hidden sm:block`} style={{ borderColor: item.color }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="w-full h-full"
                        />
                      </div>
                      
                      {/* Main Circle */}
                      <div 
                        className={`relative w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg sm:shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}
                        style={{ boxShadow: `0 10px 20px ${item.color}20` }}
                      >
                        {/* Inner Glow */}
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Icon */}
                        <item.icon size={24} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300 sm:hidden" />
                        <item.icon size={36} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300 hidden sm:block" />
                        
                        {/* Step Badge */}
                        <div className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 w-6 h-6 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center shadow-md sm:shadow-lg border-2" style={{ borderColor: item.color }}>
                          <span className="text-[10px] sm:text-xs font-bold" style={{ color: item.color }}>{item.step}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Content Card */}
                    <div className="relative w-full flex-1 flex flex-col">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                      
                      <div className="relative bg-white rounded-xl sm:rounded-2xl border border-[var(--border)] group-hover:border-transparent shadow-sm group-hover:shadow-xl transition-all duration-500 flex-1 flex flex-col" style={{ padding: '16px 14px' }}>
                        {/* Decorative Corner - Hidden on mobile */}
                        <div 
                          className="absolute top-0 end-0 w-12 h-12 sm:w-16 sm:h-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300 hidden sm:block"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.color} 0%, transparent 60%)`,
                            borderRadius: '0 16px 0 100%'
                          }}
                        />
                        
                        <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-[var(--black)] mb-1 sm:mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300 line-clamp-2" style={{ '--hover-gradient': `linear-gradient(135deg, ${item.color}, ${item.color}dd)` } as React.CSSProperties}>
                          <span className="group-hover:hidden">{item.title}</span>
                          <span className={`hidden group-hover:inline bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.title}</span>
                        </h3>
                        <p className="text-[var(--text-grey)] leading-relaxed text-xs sm:text-sm lg:text-base line-clamp-3 sm:line-clamp-none">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </section>

      {/* Spacer between How It Works and Shops */}
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Recommended Shops Section */}
      <section className="py-6 sm:py-12 lg:py-16 bg-[var(--main-bg)]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-5 sm:mb-8 lg:mb-10"
          >
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--black)]">
                {t('recommendedShops')}
              </h2>
              {selectedAddress && (
                <p className="text-sm text-[var(--text-grey)] mt-1">
                  {tCommon('nearYou')}: {selectedAddress.title || selectedAddress.address?.split(',')[0]}
                </p>
              )}
            </div>
            <Link
              href="/shops"
              className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
              style={{ padding: '10px 16px' }}
            >
              {tCommon('viewAll')}
              {isRTL ? <ChevronLeft size={14} className="sm:hidden" /> : <ChevronRight size={14} className="sm:hidden" />}
              {isRTL ? <ChevronLeft size={16} className="hidden sm:block" /> : <ChevronRight size={16} className="hidden sm:block" />}
            </Link>
          </motion.div>

          {loading || shopsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShopCardSkeleton key={i} />
              ))}
            </div>
          ) : recommendedShops.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 sm:mb-6">
                <MapPin size={32} className="text-gray-400 sm:hidden" />
                <MapPin size={40} className="text-gray-400 hidden sm:block" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--black)] mb-2">
                {tCommon('noShopsInArea')}
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-grey)] max-w-md">
                {tCommon('tryChangeAddress')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
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
      <div className="h-4 sm:h-8 lg:h-12 bg-[var(--main-bg)]" />

      {/* Download App Section */}
      <section className="py-10 sm:py-16 lg:py-20 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[var(--primary)]/20 rounded-full blur-[60px] sm:blur-[100px]" />
          <div className="absolute bottom-0 end-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[var(--primary-dark)]/20 rounded-full blur-[60px] sm:blur-[100px]" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-white text-center lg:text-start"
            >
              <span className="inline-block bg-white/10 text-[var(--primary-light)] text-xs sm:text-sm font-semibold rounded-full mb-5 sm:mb-8" style={{ padding: '8px 18px' }}>
                {t('app.badge')}
              </span>
              
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                {t('downloadApp')}
                <span className="block text-[var(--primary)] mt-1 sm:mt-2">{t('now')}</span>
              </h2>
              
              <p className="text-sm sm:text-lg text-gray-400 mb-6 sm:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {t('downloadAppSubtitle')}. {t('downloadAppDescription')}
              </p>

              {/* App store buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 mb-8 sm:mb-12">
                <a
                  href="#"
                  className="group flex items-center gap-2.5 sm:gap-4 min-w-[140px] sm:min-w-[180px] bg-gradient-to-b from-gray-800 to-black text-white rounded-xl hover:from-gray-700 hover:to-gray-900 hover:scale-[1.03] transition-all duration-300 shadow-xl border border-gray-600/50"
                  style={{ padding: '14px 20px' }}
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <p className="text-[10px] sm:text-[11px] text-gray-400 leading-tight">Download on the</p>
                    <p className="font-bold text-base sm:text-xl leading-tight">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="group flex items-center gap-2.5 sm:gap-4 min-w-[140px] sm:min-w-[180px] bg-gradient-to-b from-gray-800 to-black text-white rounded-xl hover:from-gray-700 hover:to-gray-900 hover:scale-[1.03] transition-all duration-300 shadow-xl border border-gray-600/50"
                  style={{ padding: '14px 20px' }}
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform">
                      <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/>
                      <path fill="#FBBC04" d="M17.556 8.307l-3.765 3.693 3.765 3.693 4.231-2.385c.474-.268.474-.948 0-1.216l-4.231-2.385z"/>
                      <path fill="#4285F4" d="M3.609 22.186L14.778 11.01l-3.765-3.693-7.404 14.87z"/>
                      <path fill="#34A853" d="M3.609 1.814l10.17 10.17 3.777-3.677L3.609 1.814z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <p className="text-[10px] sm:text-[11px] text-gray-400 leading-tight">Get it on</p>
                    <p className="font-bold text-base sm:text-xl leading-tight">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-white/10">
                <div className="text-center lg:text-start">
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">4.9</p>
                  <div className="flex items-center justify-center lg:justify-start gap-0.5 sm:gap-1 text-[var(--star)]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="fill-current sm:hidden" />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <Star key={`lg-${i}`} size={14} className="fill-current hidden sm:block" />
                    ))}
                  </div>
                </div>
                <div className="w-px h-10 sm:h-14 bg-white/10" />
                <div className="text-center lg:text-start">
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">50K+</p>
                  <p className="text-xs sm:text-sm text-gray-400">{tCommon('downloads')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center py-6 sm:py-10 lg:py-16"
            >
              <div className="relative">
                <div className="relative w-40 sm:w-52 lg:w-64 aspect-[9/18]">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)] rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden relative">
                      <div className="absolute top-0 inset-x-0 flex justify-center pt-1.5 sm:pt-2">
                        <div className="w-16 h-4 sm:w-24 sm:h-6 bg-black rounded-full" />
                      </div>
                      <div className="flex flex-col items-center justify-center h-full">
                        <Image
                          src="/images/maksab.png"
                          alt="Maksab App"
                          width={120}
                          height={120}
                          className="mb-2 sm:mb-4 w-20 h-20 sm:w-[120px] sm:h-[120px]"
                        />
                        <p className="text-white/70 text-xs sm:text-sm">{t('title')}</p>
                      </div>
                    </div>
                  </div>
                </div>

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
              style={{ padding: '12px' }}
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

      {/* Footer - Only on Home Page */}
      <Footer />
    </div>
  );
};

export default HomePage;
