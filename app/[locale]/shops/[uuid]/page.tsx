'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { clsx } from 'clsx';

import {
  Button,
  Badge,
  Rating,
  ProductCardSkeleton,
  EmptyState,
} from '@/components/ui';
import { ProductCard } from '@/components/cards';
import { shopService } from '@/services';
import { Shop, Category, Product } from '@/types';
import { useFavoritesStore, useSettingsStore } from '@/store';

interface ShopPageProps {
  params: Promise<{ uuid: string }>;
}

const ShopPage = ({ params }: ShopPageProps) => {
  const resolvedParams = use(params);
  const { uuid } = resolvedParams;

  const t = useTranslations('shop');
  const tCommon = useTranslations('common');
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';
  const { toggleFavoriteShop, isFavoriteShop } = useFavoritesStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchShopData();
  }, [uuid]);

  useEffect(() => {
    if (shop) {
      fetchProducts();
    }
  }, [selectedCategory, shop]);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const [shopRes, categoriesRes, popularRes] = await Promise.all([
        shopService.getShopDetails(uuid),
        shopService.getShopCategories(0), // Will be replaced with shop id
        shopService.getRecommendedShops({ perPage: 4 }),
      ]);

      setShop(shopRes.data);
      
      // Fetch shop categories after getting shop data
      if (shopRes.data?.id) {
        const catRes = await shopService.getShopCategories(shopRes.data.id);
        setCategories(catRes.data || []);
        
        // Fetch popular products
        const popRes = await shopService.getShopRecommendedProducts(shopRes.data.id, { perPage: 8 });
        setPopularProducts(popRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!shop) return;
    
    setProductsLoading(true);
    try {
      const response = await shopService.getShopProducts(shop.id, {
        perPage: 20,
        category_id: selectedCategory || undefined,
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const isFavorite = shop ? isFavoriteShop(shop.id) : false;

  const handleToggleFavorite = () => {
    if (shop) {
      toggleFavoriteShop(shop.id);
    }
  };

  const deliveryTime = shop?.delivery_time
    ? `${shop.delivery_time.from}-${shop.delivery_time.to} ${tCommon('min')}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)]">
        {/* Skeleton Header */}
        <div className="bg-white">
          <div className="h-64 bg-[var(--border)] skeleton" />
          <div className="container py-6">
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-[var(--radius-lg)] bg-[var(--border)] skeleton" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-[var(--border)] skeleton rounded" />
                <div className="h-4 w-32 bg-[var(--border)] skeleton rounded" />
                <div className="h-4 w-64 bg-[var(--border)] skeleton rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          type="search"
          title="المتجر غير موجود"
          description="المتجر الذي تبحث عنه غير متاح"
          action={{ label: 'العودة للمتاجر', onClick: () => window.history.back() }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* Shop Header */}
      <div className="bg-white">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)]">
          {shop.background_img && (
            <Image
              src={shop.background_img}
              alt={shop.translation?.title || ''}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Back Button */}
          <Link
            href="/shops"
            className="absolute top-4 start-4 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Link>

          {/* Actions */}
          <div className="absolute top-4 end-4 flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all',
                isFavorite
                  ? 'bg-[var(--error)] text-white'
                  : 'bg-white/90 text-[var(--text-grey)] hover:text-[var(--error)]'
              )}
            >
              <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
              <Share2 size={20} className="text-[var(--text-grey)]" />
            </button>
          </div>

          {/* Status Badge */}
          {!shop.open && (
            <Badge variant="error" className="absolute bottom-4 start-4">
              {tCommon('closed')}
            </Badge>
          )}
        </div>

        {/* Shop Info */}
        <div className="container relative">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 -mt-12 md:-mt-16">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[var(--radius-lg)] overflow-hidden bg-white shadow-lg border-4 border-white shrink-0">
              {shop.logo_img ? (
                <Image
                  src={shop.logo_img}
                  alt={shop.translation?.title || ''}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--primary-dark)] text-white text-2xl font-bold">
                  {shop.translation?.title?.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--black)] mb-2">
                    {shop.translation?.title}
                  </h1>
                  <p className="text-[var(--text-grey)] mb-4 max-w-xl">
                    {shop.translation?.description}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
                  <div className="flex items-center gap-2">
                    <Rating value={shop.rating_avg} showValue reviewsCount={shop.reviews_count} />
                  </div>
                )}
                
                {deliveryTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-[var(--text-grey)]" />
                    <span>{deliveryTime}</span>
                  </div>
                )}

                {shop.min_amount !== undefined && shop.min_amount > 0 && (
                  <Badge variant="outline">
                    الحد الأدنى {tCommon('sar')} {shop.min_amount}
                  </Badge>
                )}

                {shop.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    <Phone size={16} />
                    {shop.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="bg-white border-y border-[var(--border)] sticky top-16 lg:top-20 z-10">
        <div className="container">
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-1 py-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={clsx(
                  'px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === null
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-grey)] hover:bg-[var(--main-bg)] hover:text-[var(--black)]'
                )}
              >
                {t('allProducts')}
              </button>
              <button
                onClick={() => setSelectedCategory(-1)} // Special ID for popular
                className={clsx(
                  'px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === -1
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-grey)] hover:bg-[var(--main-bg)] hover:text-[var(--black)]'
                )}
              >
                {t('popular')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all',
                    selectedCategory === category.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-grey)] hover:bg-[var(--main-bg)] hover:text-[var(--black)]'
                  )}
                >
                  {category.translation?.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container py-8">
        {/* Popular Products Section */}
        {selectedCategory === -1 && popularProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-[var(--black)] mb-4">
              {t('popular')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Products */}
        {selectedCategory !== -1 && (
          <>
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                type="search"
                title={t('noProducts')}
                description="لا توجد منتجات في هذا القسم"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPage;

