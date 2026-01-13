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
  Tag,
  ChevronRight,
  ChevronLeft,
  Ticket,
  Store,
  Package,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, EmptyState } from '@/components/ui';
import { cartService } from '@/services';
import { Cart, CartDetail } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore } from '@/store';

// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ============================================
// CART ITEM COMPONENT
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
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      className={clsx(
        'group relative bg-white rounded-2xl p-4 sm:p-5',
        'border border-gray-100 hover:border-gray-200',
        'shadow-sm hover:shadow-md',
        'transition-all duration-300',
        isRemoving && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
          {productImage ? (
            <Image
              src={productImage}
              alt={productTitle}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={32} className="text-gray-300" />
            </div>
          )}
          
          {/* Discount Badge */}
          {item.discount && item.discount > 0 && (
            <div className="absolute top-1 start-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              -{Math.round((item.discount / (item.price + item.discount)) * 100)}%
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title & Remove */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">
              {productTitle}
            </h3>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className={clsx(
                'p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50',
                'transition-colors shrink-0',
                'opacity-0 group-hover:opacity-100 sm:opacity-100'
              )}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Extras/Variants */}
          {item.stock?.extras && item.stock.extras.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.stock.extras.map((extra) => (
                <span
                  key={extra.id}
                  className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  {extra.group?.translation?.title}: {extra.value}
                </span>
              ))}
            </div>
          )}

          {/* Price & Quantity */}
          <div className="mt-auto flex items-end justify-between gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  item.quantity <= 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm active:scale-95'
                )}
              >
                <Minus size={16} />
              </button>
              <span className={clsx(
                'w-8 text-center font-semibold text-gray-900',
                isUpdating && 'opacity-50'
              )}>
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating}
                className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] transition-all active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Price */}
            <div className="text-end">
              <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
                {totalPrice.toFixed(2)} <span className="text-sm font-medium">{currency}</span>
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-400">
                  {unitPrice.toFixed(2)} × {item.quantity}
                </p>
              )}
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
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-4 flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-40 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-10 w-32 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded-xl" />
              <div className="space-y-3 py-4">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="h-14 w-full bg-gray-200 rounded-xl" />
            </div>
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
    } catch (error) {
      console.error('Error fetching cart:', error);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 rounded-full flex items-center justify-center">
            <ShoppingBag size={40} className="text-[var(--primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('loginRequired')}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {t('loginRequiredDesc')}
          </p>
          <Link href="/auth/login?redirect=/cart">
            <Button size="lg" className="px-8">
              {tCommon('login')}
              <ArrowIcon size={18} className="ms-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Empty Cart State
  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
            <ShoppingBag size={56} className="text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('empty')}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {t('emptySubtitle')}
          </p>
          <Link href="/shops">
            <Button size="lg" className="px-8">
              <Store size={18} className="me-2" />
              {t('browsShops')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
            <p className="text-gray-500 mt-1">
              {itemCount} {t('item')} {cart.shop && `${t('from')} ${cart.shop.translation?.title}`}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleClearCart}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 self-start sm:self-auto"
          >
            <Trash2 size={18} className="me-2" />
            {t('clearCart')}
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Shop Info Card */}
            {cart.shop && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {cart.shop.logo_img ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <Image
                        src={cart.shop.logo_img}
                        alt={cart.shop.translation?.title || ''}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shrink-0">
                      <Store size={24} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {cart.shop.translation?.title}
                    </h3>
                    {cart.shop.translation?.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {cart.shop.translation.description}
                      </p>
                    )}
                  </div>
                  <Link href={`/shops/${cart.shop.uuid}`}>
                    <Button variant="outline" size="sm" className="shrink-0 hidden sm:flex">
                      {t('viewShop')}
                      <ChevronIcon size={16} className="ms-1" />
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
              className="space-y-3"
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
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Sparkles size={20} className="text-[var(--primary)]" />
                {t('orderSummary')}
              </h2>

              {/* Coupon Input */}
              <div className="mb-6">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Ticket size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                        'w-full h-12 ps-10 pe-4 rounded-xl border-2 bg-gray-50 text-gray-900',
                        'placeholder:text-gray-400 focus:outline-none focus:bg-white',
                        'transition-all duration-200',
                        couponError ? 'border-red-300 focus:border-red-400' :
                        couponSuccess ? 'border-green-300 focus:border-green-400' :
                        'border-transparent focus:border-[var(--primary)]'
                      )}
                    />
                    {couponSuccess && (
                      <Check size={18} className="absolute end-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-12 px-5"
                  >
                    {couponLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t('apply')
                    )}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {couponError}
                  </p>
                )}
                {couponSuccess && appliedCoupon && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <Check size={14} />
                    {t('couponApplied')}: {appliedCoupon}
                  </p>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-3 py-5 border-y border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('subtotal')}</span>
                  <span className="font-medium text-gray-900">
                    {subtotal.toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('deliveryFee')}</span>
                  <span className="font-medium text-gray-500">{t('toBeCalculated')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('discount')}</span>
                    <span>-0.00 {currency}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-5">
                <span className="text-lg font-bold text-gray-900">{t('total')}</span>
                <span className="text-2xl font-bold text-[var(--primary)]">
                  {(cart.total_price || subtotal).toFixed(2)} <span className="text-base">{currency}</span>
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
                className="h-14 text-base font-semibold shadow-lg shadow-[var(--primary)]/20"
              >
                {t('checkout')}
                <ArrowIcon size={20} className="ms-2" />
              </Button>

              {/* Continue Shopping */}
              <Link href="/shops" className="block mt-4">
                <Button variant="ghost" fullWidth className="text-gray-500">
                  {t('continueShopping')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
