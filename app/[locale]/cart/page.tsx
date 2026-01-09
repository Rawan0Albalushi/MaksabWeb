'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  Tag,
  ChevronRight,
  ChevronLeft,
  Ticket,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Input, Card, Badge, EmptyState, QuantitySelector } from '@/components/ui';
import { cartService } from '@/services';
import { Cart, CartDetail } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore } from '@/store';

const CartPage = () => {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';
  
  const { user, isAuthenticated } = useAuthStore();
  const { cart, setCart, clearCart, setLoading: setCartLoading } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

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
    if (!confirm('هل أنت متأكد من تفريغ السلة؟')) return;
    
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
    
    try {
      const response = await cartService.checkCoupon(cart.shop_id, couponCode);
      if (response.data?.valid) {
        setAppliedCoupon(couponCode);
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

  // Get all cart items from user_carts
  const cartItems: CartDetail[] = cart?.user_carts?.flatMap(uc => uc.cart_details || []) || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] py-8">
        <div className="container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--border)] rounded" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-[var(--radius-lg)] p-4 flex gap-4">
                    <div className="w-24 h-24 bg-[var(--border)] rounded-[var(--radius-md)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-[var(--border)] rounded" />
                      <div className="h-4 w-24 bg-[var(--border)] rounded" />
                      <div className="h-8 w-28 bg-[var(--border)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[var(--radius-lg)] p-6 h-fit">
                <div className="space-y-4">
                  <div className="h-6 w-32 bg-[var(--border)] rounded" />
                  <div className="h-4 w-full bg-[var(--border)] rounded" />
                  <div className="h-4 w-full bg-[var(--border)] rounded" />
                  <div className="h-12 w-full bg-[var(--border)] rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-[var(--border)] rounded-full flex items-center justify-center">
            <ShoppingBag size={48} className="text-[var(--text-grey)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--black)] mb-2">
            سجّل دخولك لعرض السلة
          </h2>
          <p className="text-[var(--text-grey)] mb-6">
            يجب عليك تسجيل الدخول لعرض سلة المشتريات
          </p>
          <Link href="/auth/login?redirect=/cart">
            <Button size="lg">{tCommon('login')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center py-16">
        <EmptyState
          type="cart"
          title={t('empty')}
          description={t('emptySubtitle')}
          action={{
            label: t('browsShops'),
            onClick: () => router.push('/shops'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)] py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--black)]">{t('title')}</h1>
            <p className="text-[var(--text-grey)]">
              {itemCount} {t('items')}
            </p>
          </div>
          <Button variant="ghost" onClick={handleClearCart} className="text-[var(--error)]">
            <Trash2 size={18} />
            {t('clearCart')}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shop Info */}
            {cart.shop && (
              <Card className="flex items-center gap-4">
                {cart.shop.logo_img && (
                  <div className="w-12 h-12 rounded-[var(--radius-md)] overflow-hidden bg-[var(--main-bg)]">
                    <Image
                      src={cart.shop.logo_img}
                      alt={cart.shop.translation?.title || ''}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-[var(--black)]">
                    {cart.shop.translation?.title}
                  </h3>
                  <p className="text-sm text-[var(--text-grey)]">
                    {cart.shop.translation?.description}
                  </p>
                </div>
                <Link href={`/shops/${cart.shop.uuid}`}>
                  <Button variant="ghost" size="sm">
                    عرض المتجر
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </Button>
                </Link>
              </Card>
            )}

            {/* Cart Items List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {cartItems.map((item) => (
                <Card key={item.id} className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-[var(--radius-md)] overflow-hidden bg-[var(--main-bg)] shrink-0">
                    {item.stock?.extras?.[0]?.group?.type === 'image' ? (
                      <Image
                        src={item.stock.extras[0].value}
                        alt=""
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-[var(--text-grey)]" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--black)] line-clamp-1 mb-1">
                      منتج #{item.stock?.id}
                    </h3>
                    
                    {/* Extras */}
                    {item.stock?.extras && item.stock.extras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.stock.extras.map((extra) => (
                          <Badge key={extra.id} variant="outline" size="sm">
                            {extra.value}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-[var(--primary)]">
                        {tCommon('sar')} {item.price.toFixed(2)}
                      </span>
                      {item.discount && item.discount > 0 && (
                        <span className="text-sm text-[var(--text-grey)] line-through">
                          {tCommon('sar')} {(item.price + item.discount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between">
                      <QuantitySelector
                        value={item.quantity}
                        min={1}
                        max={99}
                        onChange={(qty) => handleUpdateQuantity(item.id, item.stock?.id || 0, qty)}
                        size="sm"
                      />
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-[var(--error)] hover:bg-[var(--error-light)] rounded-[var(--radius-md)] transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">
                ملخص الطلب
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                <label className="text-sm font-medium text-[var(--black)] mb-2 block">
                  {t('couponCode')}
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل الكوبون"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    leftIcon={<Ticket size={18} />}
                    error={couponError}
                    containerClassName="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    isLoading={couponLoading}
                  >
                    {t('apply')}
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-[var(--success)] mt-2">
                    ✓ {t('couponApplied')}: {appliedCoupon}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-3 py-4 border-y border-[var(--border)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">{t('subtotal')}</span>
                  <span className="text-[var(--black)]">
                    {tCommon('sar')} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">{t('deliveryFee')}</span>
                  <span className="text-[var(--black)]">يحدد لاحقاً</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-[var(--success)]">
                    <span>{t('discount')}</span>
                    <span>-{tCommon('sar')} 0.00</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between py-4 mb-4">
                <span className="text-lg font-bold text-[var(--black)]">{t('total')}</span>
                <span className="text-lg font-bold text-[var(--primary)]">
                  {tCommon('sar')} {cart.total_price?.toFixed(2) || subtotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
                rightIcon={isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              >
                {t('checkout')}
              </Button>

              {/* Continue Shopping */}
              <Link href="/shops" className="block mt-4">
                <Button variant="ghost" fullWidth>
                  {t('continueShopping')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

