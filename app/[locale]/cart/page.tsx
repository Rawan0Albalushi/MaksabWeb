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
  CreditCard,
  Heart,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Modal } from '@/components/ui';
import { cartService } from '@/services';
import { Cart, CartDetail, CalculateResult } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore, useLocationStore } from '@/store';

// ============================================
// CONFIRMATION MODAL COMPONENT
// ============================================
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div style={{ 
        padding: '24px 28px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.08) 0%, rgba(0, 151, 155, 0.08) 100%)'
      }}>
        {/* Warning Icon */}
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 20px auto',
            backgroundColor: '#FFF2EE',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Trash2 className="w-8 h-8 text-[var(--error)]" />
        </div>
        
        {/* Title */}
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#232B2F', marginBottom: '12px' }}>
          {title}
        </h3>
        
        {/* Message */}
        <p style={{ color: '#898989', marginBottom: '28px', lineHeight: '1.6' }}>
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
            className="!border-gray-300 !text-gray-700 hover:!bg-gray-100"
            style={{ padding: '14px 20px' }}
          >
            {cancelText}
          </Button>
          <Button
            fullWidth
            onClick={onConfirm}
            disabled={isLoading}
            className="!bg-red-500 hover:!bg-red-600 !text-white"
            style={{ padding: '14px 20px' }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

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
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Sync local quantity with item quantity when it changes from parent
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const product = item.stock?.product;
  const productImage = product?.img || item.stock?.extras?.find(e => e.group?.type === 'image')?.value;
  const productTitle = product?.translation?.title || `#${item.stock?.id}`;
  
  // حساب سعر الوحدة للمنتج الأساسي
  const baseUnitPrice = item.stock?.total_price || (item.quantity > 0 ? item.price / item.quantity : item.price);
  
  // حساب سعر الإضافات (Addons)
  const addonsPrice = item.addons?.reduce((sum, addon) => {
    const addonPrice = addon.stock?.total_price ?? addon.stock?.price ?? addon.price ?? 0;
    return sum + (addonPrice * (addon.quantity || 1));
  }, 0) || 0;
  
  // السعر الإجمالي للوحدة (المنتج + الإضافات)
  const unitPrice = baseUnitPrice + addonsPrice;
  const totalPrice = unitPrice * localQuantity;

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1 || isUpdating) return;
    
    // Optimistic update - change UI immediately
    setLocalQuantity(newQty);
    setIsUpdating(true);
    
    try {
      await onUpdateQuantity(newQty);
    } catch (error) {
      // Revert on error
      setLocalQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
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
      <div style={{ padding: '14px 16px' }} className="sm:!p-5">
        <div className="flex gap-3 sm:gap-5">
          {/* Product Image */}
          <div className="relative shrink-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-gray-100">
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
                                <div 
                                  className="absolute top-2 start-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-md"
                                  style={{ padding: '6px 10px' }}
                                >
                                  -{Math.round((item.discount / (item.price + item.discount)) * 100)}%
                                </div>
                              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Top Row: Title & Delete */}
            <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-lg line-clamp-2 mb-1 sm:mb-2">
                  {productTitle}
                </h3>
                
                {/* Extras/Variants */}
                {item.stock?.extras && item.stock.extras.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {item.stock.extras.map((extra) => (
                      <span
                        key={extra.id}
                        className="inline-flex items-center bg-gray-100 text-gray-600 text-xs rounded-md"
                        style={{ padding: '6px 10px' }}
                      >
                        <span className="text-gray-400">{extra.group?.translation?.title}:</span>
                        <span className="ms-1 font-medium">{extra.value}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Addons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.addons.map((addon) => {
                      const addonTitle = addon.stock?.product?.translation?.title || `إضافة #${addon.id}`;
                      const addonPrice = addon.stock?.total_price ?? addon.stock?.price ?? addon.price ?? 0;
                      return (
                        <span
                          key={addon.id}
                          className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-md"
                          style={{ padding: '6px 10px' }}
                        >
                          <span className="font-medium">+ {addonTitle}</span>
                          {addonPrice > 0 && (
                            <span className="ms-1 text-[var(--primary)]/70">
                              ({addonPrice.toFixed(3)} {currency})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Delete Button */}
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Bottom Row: Quantity & Price */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              {/* Quantity Selector */}
              <div className="flex items-center rounded-lg sm:rounded-xl overflow-hidden border-2 border-gray-300">
                <button
                  onClick={() => handleQuantityChange(localQuantity + 1)}
                  disabled={isUpdating}
                  style={{ backgroundColor: '#FF3D00', color: 'white' }}
                  className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <span className={clsx(
                  'w-10 sm:w-14 text-center font-bold text-[var(--black)] text-base sm:text-lg bg-white',
                  isUpdating && 'opacity-50 animate-pulse'
                )}>
                  {localQuantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(localQuantity - 1)}
                  disabled={localQuantity <= 1 || isUpdating}
                  style={{ 
                    backgroundColor: localQuantity <= 1 ? '#DCDCDC' : '#898989',
                    color: localQuantity <= 1 ? '#A7A7A7' : 'white',
                    cursor: localQuantity <= 1 ? 'not-allowed' : 'pointer'
                  }}
                  className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Price */}
              <div className="text-end">
                <p className="text-base sm:text-2xl font-bold text-[var(--primary)]">
                  {totalPrice.toFixed(3)}
                  <span className="text-xs sm:text-sm font-medium text-gray-500 ms-1">{currency}</span>
                </p>
                {localQuantity > 1 && (
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                    {unitPrice.toFixed(3)} × {localQuantity}
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
  <div className="min-h-screen bg-[var(--main-bg)]">
    {/* Header Skeleton */}
    <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C]">
      <div className="container max-w-6xl mx-auto" style={{ padding: '24px 18px 32px 18px' }}>
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
    <div className="container max-w-6xl mx-auto" style={{ padding: '24px 18px' }}>
      <div className="animate-pulse grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl flex gap-4" style={{ padding: '14px 16px' }}>
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl flex gap-4" style={{ padding: '14px 16px' }}>
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
          <div className="bg-white rounded-2xl space-y-5" style={{ padding: '16px 18px' }}>
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
  const { selectedAddress } = useLocationStore();

  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingCart, setClearingCart] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<CalculateResult | null>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);

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

  // Calculate prices when cart or address changes
  useEffect(() => {
    if (cart?.id) {
      calculatePrices();
    }
  }, [cart?.id, selectedAddress?.id, appliedCoupon]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      setCart(response.data);
    } catch (error: any) {
      // 404 means cart is empty/doesn't exist - this is expected
      if (error?.response?.status === 404) {
        clearCart();
      } else {
        console.error('Error fetching cart:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = async () => {
    if (!cart?.id) return;

    setCalculateLoading(true);
    try {
      // Build location from selected address
      let formattedLocation: { latitude: number; longitude: number } | undefined;
      if (selectedAddress?.location) {
        if (Array.isArray(selectedAddress.location)) {
          formattedLocation = {
            latitude: selectedAddress.location[0],
            longitude: selectedAddress.location[1],
          };
        } else if (typeof selectedAddress.location === 'object') {
          formattedLocation = selectedAddress.location as { latitude: number; longitude: number };
        }
      }

      const calculateData = {
        type: 'delivery' as const,
        coupon: appliedCoupon || undefined,
        address: formattedLocation,
      };

      const response = await cartService.calculateCart(cart.id, calculateData);
      setCalculatedPrices(response.data);
    } catch (error) {
      console.error('Error calculating prices:', error);
      setCalculatedPrices(null);
    } finally {
      setCalculateLoading(false);
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
    console.log('🗑️ Attempting to delete cart item:', cartDetailId);
    
    // Optimistic update - remove from UI immediately
    if (cart) {
      const updatedCart = {
        ...cart,
        user_carts: cart.user_carts?.map(uc => ({
          ...uc,
          cart_details: uc.cart_details?.filter(cd => cd.id !== cartDetailId),
          cartDetails: uc.cartDetails?.filter(cd => cd.id !== cartDetailId),
        }))
      };
      setCart(updatedCart);
    }
    
    try {
      await cartService.deleteCartProduct(cartDetailId);
      
      // Refresh cart to sync with server
      try {
        const response = await cartService.getCart();
        setCart(response.data);
      } catch (error: any) {
        // If cart is empty (404), clear it
        if (error?.response?.status === 404) {
          clearCart();
        }
      }
    } catch (error: any) {
      console.error('❌ Error removing item:', error);
      // On error, refresh cart to restore the item
      fetchCart();
    }
  };

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = async () => {
    setClearingCart(true);
    try {
      await cartService.deleteCart(cart?.id);
      clearCart();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setClearingCart(false);
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
  
  // Helper function to calculate item total with addons
  const calculateItemTotal = (item: CartDetail) => {
    const basePrice = item.stock?.total_price || (item.quantity > 0 ? item.price / item.quantity : item.price);
    const addonsPrice = item.addons?.reduce((sum, addon) => {
      const addonPrice = addon.stock?.total_price ?? addon.stock?.price ?? addon.price ?? 0;
      return sum + (addonPrice * (addon.quantity || 1));
    }, 0) || 0;
    return (basePrice + addonsPrice) * item.quantity;
  };
  
  // حساب المجموع الفرعي شامل الإضافات
  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading State
  if (loading) {
    return <CartSkeleton />;
  }

  // Not Authenticated State
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center px-4"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-lg shadow-orange-100"
            style={{ marginBottom: '48px' }}
          >
            <ShoppingBag className="w-20 h-20 sm:w-24 sm:h-24 text-orange-400" />
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ marginBottom: '16px' }}>
            {t('loginRequired')}
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xs" style={{ marginBottom: '56px' }}>
            {t('loginRequiredDesc')}
          </p>
          
          <Link href="/auth/login?redirect=/cart">
            <Button size="lg" className="text-base sm:text-lg font-semibold rounded-xl shadow-lg shadow-orange-200 !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]" style={{ padding: '16px 40px' }}>
              {tCommon('login')}
              <ArrowIcon className="w-5 h-5 sm:w-6 sm:h-6 ms-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Empty Cart State
  if (!cart || cartItems.length === 0) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center px-4"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-lg shadow-orange-100"
            style={{ marginBottom: '48px' }}
          >
            <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-orange-400" />
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ marginBottom: '16px' }}>
            {t('empty')}
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xs" style={{ marginBottom: '56px' }}>
            {t('emptySubtitle')}
          </p>
          
          <Link href="/shops">
            <Button size="lg" className="text-base sm:text-lg font-semibold rounded-xl shadow-lg shadow-orange-200 !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]" style={{ padding: '16px 40px' }}>
              <Store className="w-5 h-5 sm:w-6 sm:h-6 me-2" />
              {t('browsShops')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Main Cart View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] relative overflow-hidden min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] flex flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-6xl mx-auto relative z-10 flex-1 flex items-center" style={{ padding: '24px 18px' }}>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                {t('title')}
              </h1>
              <p className="text-white/60 text-sm sm:text-base lg:text-lg">
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
              className="text-white/70 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-400/30"
              style={{ padding: '10px 16px' }}
            >
              <Trash2 className="w-4 h-4 me-1.5 sm:me-2" />
              <span className="hidden sm:inline">{t('clearCart')}</span>
            </Button>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#F4F4F4" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto" style={{ padding: '24px 18px' }}>
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Cart Items - Takes 3 columns */}
          <div className="lg:col-span-3 order-1 space-y-4">
            {/* Shop Card */}
            {cart.shop && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200/60 shadow-sm"
                style={{ padding: '14px 16px' }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
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
                    <Button variant="outline" size="sm" className="rounded-lg text-sm border-[var(--primary)] text-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-white" style={{ padding: '10px 18px' }}>
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
              <Link href={cart.shop?.uuid ? `/shops/${cart.shop.uuid}` : '/shops'}>
                <Button variant="ghost" fullWidth className="text-gray-500" style={{ padding: '14px 20px' }}>
                  <Store className="w-5 h-5 me-2" />
                  {t('continueShopping')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary - Takes 2 columns */}
          <div className="lg:col-span-2 order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm lg:sticky lg:top-24"
              style={{ padding: '16px 18px' }}
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
                    <Ticket style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} className="w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t('enterCoupon')}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                        setCouponSuccess(false);
                      }}
                      style={{ paddingRight: '44px', paddingLeft: '14px' }}
                      className={clsx(
                        'w-full h-11 sm:h-12 rounded-xl border-2 bg-gray-50',
                        'text-gray-900 placeholder:text-gray-400 text-right',
                        'focus:outline-none focus:bg-white transition-all',
                        couponError ? 'border-red-300 focus:border-red-400' :
                        couponSuccess ? 'border-green-300' :
                        'border-gray-200 focus:border-[var(--primary)]'
                      )}
                    />
                    {couponSuccess && (
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-11 sm:h-12 rounded-xl shrink-0"
                    style={{ padding: '10px 20px' }}
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
                    className="flex items-center gap-2 mt-2 bg-red-50 rounded-lg"
                    style={{ padding: '10px 14px' }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600">{couponError}</p>
                  </motion.div>
                )}
                {couponSuccess && appliedCoupon && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 bg-green-50 rounded-lg"
                    style={{ padding: '10px 14px' }}
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
                {/* Subtotal - سعر المنتجات */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('subtotal')}</span>
                  <span className="font-semibold text-gray-900">
                    {(calculatedPrices?.price ?? subtotal).toFixed(3)} {currency}
                  </span>
                </div>

                {/* Delivery Fee - رسوم التوصيل */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    {t('deliveryFee')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {calculateLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (() => {
                      const fee = calculatedPrices?.delivery_fee ?? calculatedPrices?.deliveryFee ?? cart.shop?.price ?? 0;
                      return fee === 0 ? (
                        <span className="text-green-600">{t('freeDelivery')}</span>
                      ) : (
                        <>{fee.toFixed(3)} {currency}</>
                      );
                    })()}
                  </span>
                </div>

                {/* Coupon Discount - خصم الكوبون */}
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
                  {calculateLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">
                        {(calculatedPrices?.total_price ?? calculatedPrices?.totalPrice ?? (subtotal + (calculatedPrices?.delivery_fee ?? calculatedPrices?.deliveryFee ?? cart.shop?.price ?? 0))).toFixed(3)}
                      </span>
                      <span className="text-sm font-medium text-gray-500 ms-1">{currency}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
                className="text-base font-semibold rounded-xl !bg-gradient-to-r !from-orange-500 !to-orange-600 hover:!from-orange-600 hover:!to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
                style={{ padding: '16px 24px' }}
              >
                <CreditCard className="w-5 h-5 me-2" />
                {t('checkout')}
                <ArrowIcon className="w-5 h-5 ms-2" />
              </Button>

              {/* Continue Shopping - Desktop */}
              <Link href={cart.shop?.uuid ? `/shops/${cart.shop.uuid}` : '/shops'} className="hidden lg:block mt-4">
                <Button variant="ghost" fullWidth className="text-gray-500 hover:text-[var(--primary)] text-sm" style={{ padding: '12px 20px' }}>
                  <Store className="w-4 h-4 me-2" />
                  {t('continueShopping')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearCart}
        title={t('clearCartTitle')}
        message={t('confirmClear')}
        confirmText={t('clearCart')}
        cancelText={tCommon('cancel')}
        isLoading={clearingCart}
      />
    </div>
  );
};

export default CartPage;
