'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Store,
  Clock,
  MapPin,
  BadgeCheck,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import { Button, Badge, Rating, QuantitySelector, ProductCardSkeleton, ExtrasSelector, AddonsSelector } from '@/components/ui';
import { ProductCard } from '@/components/cards';
import { productService, cartService } from '@/services';
import { Product, Stock } from '@/types';
import { useFavoritesStore, useCartStore, useAuthStore, useSettingsStore } from '@/store';
import { useProductExtras } from '@/hooks';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ProductPageProps {
  params: Promise<{ uuid: string }>;
}

const ProductPage = ({ params }: ProductPageProps) => {
  const resolvedParams = use(params);
  const { uuid } = resolvedParams;

  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const { toggleFavoriteProduct, isFavoriteProduct } = useFavoritesStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  // Extras & Addons management
  const {
    selectedStock,
    typedExtras,
    selectExtra,
    toggleAddon,
    incrementAddon,
    decrementAddon,
    calculateTotalPrice,
    getActiveAddons,
    hasExtras,
    hasAddons,
    addonsState,
  } = useProductExtras({
    stocks: product?.stocks || [],
  });

  useEffect(() => {
    fetchProductData();
  }, [uuid]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const [productRes] = await Promise.all([
        productService.getProductDetails(uuid),
      ]);

      setProduct(productRes.data);

      // Fetch similar products
      if (productRes.data?.category?.id) {
        const similarRes = await productService.getSimilarProducts(
          productRes.data.category.id,
          productRes.data.id
        );
        setSimilarProducts(similarRes.data?.slice(0, 4) || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = product ? isFavoriteProduct(product.id) : false;

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavoriteProduct(product.id);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedStock || !product?.shop) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/products/${uuid}`);
      return;
    }

    setAddingToCart(true);
    try {
      // Get active addons with their quantities
      const activeAddons = getActiveAddons();
      
      // Build addons array for cart service
      const addonsForCart = activeAddons.map(addon => ({
        stock_id: addon.stocks?.id ?? addon.product?.stock?.id ?? addon.product?.stocks?.[0]?.id ?? 0,
        quantity: addon.quantity,
      })).filter(addon => addon.stock_id > 0);

      const response = await cartService.addToCart({
        shop_id: product.shop.id,
        stock_id: selectedStock.id,
        quantity,
        addons: addonsForCart.length > 0 ? addonsForCart : undefined,
      });
      setCart(response.data);
      // Show success message or navigate to cart
      alert(t('addedToCart'));
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  // Price calculations with addons
  const basePrice = selectedStock?.total_price ?? selectedStock?.price ?? 0;
  const originalPrice = selectedStock?.price ?? 0;
  const totalPrice = calculateTotalPrice(quantity);
  const unitPriceWithAddons = quantity > 0 ? totalPrice / quantity : basePrice;
  const hasDiscount = selectedStock?.discount && selectedStock.discount > 0;
  const isOutOfStock = selectedStock?.quantity === 0;

  const images = [
    product?.img,
    ...(product?.galleries?.map((g) => g.path) || []),
  ].filter(Boolean) as string[];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)]">
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Skeleton */}
            <div className="aspect-square bg-white rounded-[var(--radius-xl)] skeleton" />
            {/* Info Skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-64 bg-[var(--border)] rounded skeleton" />
              <div className="h-4 w-48 bg-[var(--border)] rounded skeleton" />
              <div className="h-6 w-32 bg-[var(--border)] rounded skeleton" />
              <div className="h-24 w-full bg-[var(--border)] rounded skeleton" />
              <div className="h-12 w-full bg-[var(--border)] rounded skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--black)] mb-2">
            المنتج غير موجود
          </h2>
          <p className="text-[var(--text-grey)] mb-6">
            المنتج الذي تبحث عنه غير متاح
          </p>
          <Button onClick={() => router.back()}>
            {tCommon('back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-[var(--text-grey)]">
          <Link href="/" className="hover:text-[var(--primary)]">
            {tCommon('home')}
          </Link>
          <span>/</span>
          {product.shop && (
            <>
              <Link
                href={`/shops/${product.shop.uuid}`}
                className="hover:text-[var(--primary)]"
              >
                {product.shop.translation?.title}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--black)]">
            {product.translation?.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-[var(--radius-xl)] overflow-hidden">
              {images.length > 1 ? (
                <Swiper
                  modules={[Navigation, Thumbs, FreeMode]}
                  navigation
                  thumbs={{ swiper: thumbsSwiper }}
                  className="aspect-square"
                >
                  {images.map((img, i) => (
                    <SwiperSlide key={i}>
                      <div className="relative aspect-square">
                        <Image
                          src={img}
                          alt={product.translation?.title || ''}
                          fill
                          className="object-contain"
                          priority={i === 0}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="relative aspect-square">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={product.translation?.title || ''}
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-grey)]">
                      <ShoppingCart size={64} />
                    </div>
                  )}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 start-4 flex flex-col gap-2 z-10">
                {hasDiscount && (
                  <Badge variant="error">
                    -{Math.round((selectedStock!.discount! / originalPrice) * 100)}%
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="outline" className="bg-white">
                    {t('outOfStock')}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 end-4 flex flex-col gap-2 z-10">
                {/* Favorite button - Hidden temporarily */}
                {/* <button
                  onClick={handleToggleFavorite}
                  className={clsx(
                    'w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all',
                    isFavorite
                      ? 'bg-[var(--error)] text-white'
                      : 'bg-white text-[var(--text-grey)] hover:text-[var(--error)]'
                  )}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                </button> */}
                <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-[var(--main-bg)] transition-colors">
                  <Share2 size={20} className="text-[var(--text-grey)]" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <Swiper
                modules={[FreeMode, Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={12}
                slidesPerView="auto"
                freeMode
                watchSlidesProgress
                className="thumbs-swiper"
              >
                {images.map((img, i) => (
                  <SwiperSlide key={i} className="!w-20 !h-20">
                    <div className="relative w-20 h-20 rounded-[var(--radius-md)] overflow-hidden bg-white cursor-pointer border-2 border-transparent hover:border-[var(--primary)] transition-colors">
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Shop Info Card */}
              {product.shop && (
                <Link
                  href={`/shops/${product.shop.uuid}`}
                  className="group block mb-6"
                >
                  <div className="relative bg-gradient-to-br from-white to-[var(--main-bg)] rounded-[var(--radius-lg)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 start-0 w-1 h-full bg-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Shop Logo */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white shadow-sm border border-[var(--border)]">
                            {product.shop.logo_img ? (
                              <Image
                                src={product.shop.logo_img}
                                alt={product.shop.translation?.title || ''}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10">
                                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--primary)]" />
                              </div>
                            )}
                          </div>
                          {/* Status dot */}
                          <div className={clsx(
                            'absolute -bottom-0.5 -end-0.5 w-4 h-4 rounded-full border-[3px] border-white',
                            product.shop.open ? 'bg-[var(--success)]' : 'bg-[var(--error)]'
                          )} />
                        </div>

                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Name + Verified */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <h3 className="font-bold text-[15px] sm:text-base text-[var(--black)] truncate group-hover:text-[var(--primary)] transition-colors">
                              {product.shop.translation?.title}
                            </h3>
                            {product.shop.verify && (
                              <BadgeCheck className="w-[18px] h-[18px] flex-shrink-0 text-[var(--primary)]" />
                            )}
                          </div>

                          {/* Row 2: Rating + Delivery + Status */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            {/* Rating */}
                            {product.shop.rating_avg !== undefined && product.shop.rating_avg > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-[var(--star)] text-[var(--star)]" />
                                <span className="font-semibold text-[var(--black)]">{product.shop.rating_avg.toFixed(1)}</span>
                                {product.shop.reviews_count !== undefined && product.shop.reviews_count > 0 && (
                                  <span className="text-[var(--text-grey)] text-[11px]">({product.shop.reviews_count})</span>
                                )}
                              </div>
                            )}

                            {/* Separator */}
                            {product.shop.rating_avg !== undefined && product.shop.rating_avg > 0 && product.shop.delivery_time && (
                              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                            )}

                            {/* Delivery Time */}
                            {product.shop.delivery_time && (
                              <div className="flex items-center gap-1 text-[var(--text-grey)]">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{product.shop.delivery_time.from}-{product.shop.delivery_time.to} {product.shop.delivery_time.type === 'minute' ? t('minutes') : t('hours')}</span>
                              </div>
                            )}
                          </div>

                          {/* Row 3: Status badge */}
                          <div className="mt-2">
                            <span className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                              product.shop.open 
                                ? 'bg-[var(--success)]/15 text-[var(--success)]' 
                                : 'bg-[var(--error)]/15 text-[var(--error)]'
                            )}>
                              <span className={clsx(
                                'w-1.5 h-1.5 rounded-full animate-pulse',
                                product.shop.open ? 'bg-[var(--success)]' : 'bg-[var(--error)]'
                              )} />
                              {product.shop.open ? t('shopOpen') : t('shopClosed')}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--main-bg)] group-hover:bg-[var(--primary)] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                          <ChevronLeft className={clsx(
                            'w-5 h-5 text-[var(--text-grey)] group-hover:text-white transition-colors',
                            !isRTL && 'rotate-180'
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--black)] mb-2">
                {product.translation?.title}
              </h1>

              {/* Rating */}
              {product.rating_avg !== undefined && product.rating_avg > 0 && (
                <div className="mb-4">
                  <Rating
                    value={product.rating_avg}
                    showValue
                    reviewsCount={product.reviews_count}
                    size="lg"
                  />
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[var(--primary)]">
                    {tCommon('sar')} {basePrice.toFixed(3)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-[var(--text-grey)] line-through">
                      {tCommon('sar')} {originalPrice.toFixed(3)}
                    </span>
                  )}
                </div>
                {/* Show total with addons if different */}
                {totalPrice !== basePrice * quantity && (
                  <p className="text-sm text-[var(--text-grey)] mt-1">
                    {t('totalWithAddons')}: <span className="font-semibold text-[var(--primary)]">{tCommon('sar')} {totalPrice.toFixed(3)}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              {product.translation?.description && (
                <div className="mb-6">
                  <h3 className="font-bold text-[var(--black)] mb-2">
                    {t('description')}
                  </h3>
                  <p className="text-[var(--text-grey)] leading-relaxed">
                    {product.translation.description}
                  </p>
                </div>
              )}

              {/* Extras Selection */}
              {hasExtras && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </span>
                    <h3 className="font-bold text-gray-900">{t('options')}</h3>
                  </div>
                  <ExtrasSelector
                    typedExtras={typedExtras}
                    onSelect={selectExtra}
                  />
                </div>
              )}

              {/* Addons Selection */}
              {hasAddons && selectedStock?.addons && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">+</span>
                    </span>
                    <h3 className="font-bold text-gray-900">{t('addons')}</h3>
                  </div>
                  <AddonsSelector
                    addons={selectedStock.addons}
                    addonsState={addonsState}
                    onToggle={toggleAddon}
                    currency={tCommon('sar')}
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="font-bold text-[var(--black)] mb-3">
                  {t('quantity')}
                </h3>
                <QuantitySelector
                  value={quantity}
                  min={product.min_qty || 1}
                  max={product.max_qty || selectedStock?.quantity || 99}
                  onChange={setQuantity}
                  size="lg"
                />
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  isLoading={addingToCart}
                  disabled={isOutOfStock}
                  leftIcon={<ShoppingCart size={20} />}
                >
                  {isOutOfStock ? t('outOfStock') : t('addToCart')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-[var(--black)] mb-6">
              {t('similarProducts')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductPage;

