'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Ticket,
  Store,
  Package,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  ShoppingCart,
  Gift,
  Truck,
  Shield,
  CreditCard,
  Heart,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button } from '@/components/ui';
import { cartService } from '@/services';
import { Cart, CartDetail } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore } from '@/store';

// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ============================================
// CART ITEM COMPONENT - IMPROVED
// ============================================
const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemove,
  currency,
  isRTL,
}: {
  item: CartDetail;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
  currency: string;
  isRTL: boolean;
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const product = item.stock?.product;
  const productImage = product?.img || item.stock?.extras?.find(e => e.group?.type === 'image')?.value;
  const productTitle = product?.translation?.title || `#${item.stock?.id}`;
  const unitPrice = item.stock?.total_price || item.price;
  const totalPrice = item.price * item.quantity;

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1 || isUpdating) return;
    setIsUpdating(true);
    await onUpdateQuantity(newQty);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove();
  };

  return (
    <motion.div
      layout
      variants={fadeInUp}
      exit={{ opacity: 0, x: isRTL ? 100 : -100, transition: { duration: 0.3 } }}
      className={clsx(
        'group relative bg-white',
        'rounded-2xl',
        'border border-gray-200/60',
        'shadow-sm hover:shadow-lg',
        'transition-all duration-300',
        'overflow-hidden',
        isRemoving && 'opacity-50 pointer-events-none scale-95'
      )}
    >
      {/* Card Content */}
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex gap-4 sm:gap-5">
          {/* Product Image */}
          <div className="relative shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-gray-100">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
              )}
              
              {/* Discount Badge */}
              {item.discount && item.discount > 0 && (
                <div className="absolute top-2 start-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md">
                  -{Math.round((item.discount / (item.price + item.discount)) * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Top Row: Title & Delete */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 mb-2">
                  {productTitle}
                </h3>
                
                {/* Extras/Variants */}
                {item.stock?.extras && item.stock.extras.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.stock.extras.map((extra) => (
                      <span
                        key={extra.id}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        <span className="text-gray-400">{extra.group?.translation?.title}:</span>
                        <span className="ms-1 font-medium">{extra.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Delete Button */}
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                aria-label="Remove item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Row: Quantity & Price */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              {/* Quantity Selector */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                    item.quantity <= 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:shadow active:scale-95'
                  )}
                >
                  <Minus className="w-5 h-5" />
                </button>
                
                <span className={clsx(
                  'w-12 text-center font-bold text-gray-900 text-lg',
                  isUpdating && 'opacity-50 animate-pulse'
                )}>
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={isUpdating}
                  className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Price */}
              <div className="text-end">
                <p className="text-xl sm:text-2xl font-bold text-[var(--primary)]">
                  {totalPrice.toFixed(2)}
                  <span className="text-sm font-medium text-gray-500 ms-1">{currency}</span>
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// SKELETON LOADER
// ============================================
const CartSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233]">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-pulse flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-white/10 rounded-lg mb-2" />
            <div className="h-4 w-28 bg-white/10 rounded" />
          </div>
          <div className="h-10 w-28 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="animate-pulse grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 flex gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 flex gap-4">
              <div className="w-28 h-28 bg-gray-200 rounded-xl" />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-10 w-32 bg-gray-200 rounded-xl" />
                  <div className="h-7 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 space-y-5">
            <div className="h-7 w-32 bg-gray-200 rounded" />
            <div className="h-12 w-full bg-gray-200 rounded-xl" />
            <div className="space-y-3 py-4 border-y border-gray-100">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </div>
            <div className="h-14 w-full bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN CART PAGE
// ============================================
const CartPage = () => {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';
  
  const { isAuthenticated } = useAuthStore();
  const { cart, setCart, clearCart } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const currency = tCommon('sar');
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      setCart(response.data);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      if (error?.response?.status === 404) {
        clearCart();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartDetailId: number, stockId: number, quantity: number) => {
    if (!cart) return;
    
    try {
      const response = await cartService.updateCartProduct({
        shop_id: cart.shop_id,
        stock_id: stockId,
        quantity,
      });
      setCart(response.data);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartDetailId: number) => {
    try {
      await cartService.deleteCartProduct(cartDetailId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    if (!confirm(t('confirmClear'))) return;
    
    try {
      await cartService.deleteCart();
      clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess(false);
    
    try {
      const response = await cartService.checkCoupon(cart.shop_id, couponCode);
      if (response.data?.valid) {
        setAppliedCoupon(couponCode);
        setCouponSuccess(true);
      } else {
        setCouponError(t('invalidCoupon'));
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || t('invalidCoupon'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/cart');
      return;
    }
    router.push('/checkout');
  };

  // Get all cart items
  const cartItems: CartDetail[] = cart?.user_carts?.flatMap(uc => uc.cart_details || uc.cartDetails || []) || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading State
  if (loading) {
    return <CartSkeleton />;
  }

  // Not Authenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-[var(--primary)]" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('loginRequired')}
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            {t('loginRequiredDesc')}
          </p>
          
          <Link href="/auth/login?redirect=/cart">
            <Button size="lg" className="px-8 py-3.5 text-base font-semibold">
              {tCommon('login')}
              <ArrowIcon className="w-5 h-5 ms-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Empty Cart State
  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm w-full"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center"
          >
            <ShoppingCart className="w-14 h-14 text-orange-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('empty')}
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            {t('emptySubtitle')}
          </p>
          
          <Link href="/shops">
            <Button size="lg" className="px-8 py-3.5 text-base font-semibold">
              <Store className="w-5 h-5 me-2" />
              {t('browsShops')}
            </Button>
          </Link>

          {/* Features */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: Gift, text: t('offers') },
              { icon: Truck, text: t('delivery') },
              { icon: Shield, text: t('secure') },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100">
                <item.icon className="w-5 h-5 text-[var(--primary)] mb-1.5" />
                <span className="text-[10px] text-gray-600 text-center">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Cart View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {t('title')}
              </h1>
              <p className="text-white/60 text-sm sm:text-base">
                {itemCount} {t('item')}
                {cart.shop && (
                  <span className="text-white/80">
                    {' '}{t('from')}{' '}
                    <span className="text-[var(--primary-light)] font-medium">{cart.shop.translation?.title}</span>
                  </span>
                )}
              </p>
            </div>
            
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-white/70 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-400/30 px-3 sm:px-4 py-2"
            >
              <Trash2 className="w-4 h-4 me-1.5 sm:me-2" />
              <span className="hidden sm:inline">{t('clearCart')}</span>
            </Button>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-6 sm:h-8" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Cart Items - Takes 3 columns */}
          <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
            {/* Shop Card */}
            {cart.shop && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/60 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Shop Logo */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {cart.shop.logo_img ? (
                      <Image
                        src={cart.shop.logo_img}
                        alt={cart.shop.translation?.title || ''}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Shop Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                      {cart.shop.translation?.title}
                    </h3>
                    {cart.shop.translation?.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {cart.shop.translation.description}
                      </p>
                    )}
                  </div>
                  
                  {/* View Shop Button */}
                  <Link href={`/shops/${cart.shop.uuid}`} className="hidden sm:block">
                    <Button variant="outline" size="sm" className="px-4 py-2 rounded-lg text-sm">
                      {t('viewShop')}
                      <ChevronIcon className="w-4 h-4 ms-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Cart Items List */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, item.stock?.id || 0, qty)}
                    onRemove={() => handleRemoveItem(item.id)}
                    currency={currency}
                    isRTL={isRTL}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Continue Shopping - Mobile */}
            <div className="lg:hidden">
              <Link href="/shops">
                <Button variant="ghost" fullWidth className="text-gray-500 py-3">
                  <Store className="w-5 h-5 me-2" />
                  {t('continueShopping')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary - Takes 2 columns */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/60 shadow-sm lg:sticky lg:top-24"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {t('orderSummary')}
                </h2>
              </div>

              {/* Coupon Input */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('couponCode')}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('enterCoupon')}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                        setCouponSuccess(false);
                      }}
                      className={clsx(
                        'w-full h-11 sm:h-12 ps-10 pe-3 rounded-xl border-2 bg-gray-50',
                        'text-gray-900 placeholder:text-gray-400',
                        'focus:outline-none focus:bg-white transition-all',
                        couponError ? 'border-red-300 focus:border-red-400' :
                        couponSuccess ? 'border-green-300' :
                        'border-gray-200 focus:border-[var(--primary)]'
                      )}
                    />
                    {couponSuccess && (
                      <div className="absolute end-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl shrink-0"
                  >
                    {couponLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t('apply')
                    )}
                  </Button>
                </div>
                
                {/* Coupon Messages */}
                {couponError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600">{couponError}</p>
                  </motion.div>
                )}
                {couponSuccess && appliedCoupon && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-50 rounded-lg"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-600">
                      {t('couponApplied')}: <span className="font-semibold">{appliedCoupon}</span>
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-3 py-4 border-y border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('subtotal')}</span>
                  <span className="font-semibold text-gray-900">
                    {subtotal.toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('deliveryFee')}</span>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {t('toBeCalculated')}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Gift className="w-4 h-4" />
                      {t('discount')}
                    </span>
                    <span className="font-semibold">-0.00 {currency}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4">
                <span className="text-base font-bold text-gray-900">{t('total')}</span>
                <div className="text-end">
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">
                    {(cart.total_price || subtotal).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-500 ms-1">{currency}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
                className="h-12 sm:h-14 text-base font-semibold rounded-xl !bg-gradient-to-r !from-orange-500 !to-orange-600 hover:!from-orange-600 hover:!to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              >
                <CreditCard className="w-5 h-5 me-2" />
                {t('checkout')}
                <ArrowIcon className="w-5 h-5 ms-2" />
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">{t('securePayment')}</span>
              </div>

              {/* Continue Shopping - Desktop */}
              <Link href="/shops" className="hidden lg:block mt-3">
                <Button variant="ghost" fullWidth className="text-gray-500 hover:text-[var(--primary)] py-2.5 text-sm">
                  <Store className="w-4 h-4 me-2" />
                  {t('continueShopping')}
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { icon: Truck, text: t('fastDelivery'), subtext: t('deliveryTime'), color: 'text-green-600', bg: 'bg-green-50' },
                { icon: Shield, text: t('guarantee'), subtext: t('moneyBack'), color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl border border-gray-200/60">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', badge.bg)}>
                    <badge.icon className={clsx('w-4 h-4', badge.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{badge.text}</p>
                    <p className="text-[10px] text-gray-500 truncate">{badge.subtext}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
