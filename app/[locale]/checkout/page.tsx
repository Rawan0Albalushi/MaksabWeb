'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  Truck,
  Store,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Ticket,
  ShoppingBag,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Card, Input, Badge, EmptyState } from '@/components/ui';
import { cartService, orderService, userService } from '@/services';
import { Cart, CartDetail, Address, CalculateResult } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore } from '@/store';

interface PaymentMethod {
  id: number;
  tag: string;
  name: string;
  icon: React.ReactNode;
  input?: number;
}

const CheckoutPage = () => {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';

  const { user, isAuthenticated } = useAuthStore();
  const { cart, setCart, clearCart } = useCartStore();

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [calculatedPrices, setCalculatedPrices] = useState<CalculateResult | null>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);
  const [error, setError] = useState('');

  // Delivery date/time
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    fetchInitialData();
  }, [isAuthenticated]);

  // Calculate prices when address or coupon changes
  useEffect(() => {
    if (cart?.id && selectedAddressId && deliveryType === 'delivery') {
      calculatePrices();
    }
  }, [selectedAddressId, appliedCoupon, deliveryType]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch cart if not in state
      if (!cart) {
        const cartResponse = await cartService.getCart();
        setCart(cartResponse.data);
      }

      // Fetch addresses
      const addressResponse = await userService.getAddresses();
      setAddresses(addressResponse.data || []);
      
      // Auto-select active address
      const activeAddress = addressResponse.data?.find(a => a.active);
      if (activeAddress) {
        setSelectedAddressId(activeAddress.id);
      } else if (addressResponse.data?.length > 0) {
        setSelectedAddressId(addressResponse.data[0].id);
      }

      // Fetch payment methods
      const paymentResponse = await orderService.getPaymentMethods();
      const methods: PaymentMethod[] = (paymentResponse.data || []).map(p => ({
        id: p.id,
        tag: p.tag,
        name: getPaymentName(p.tag),
        icon: getPaymentIcon(p.tag),
        input: p.input,
      }));
      setPaymentMethods(methods);
      
      // Auto-select first payment method
      if (methods.length > 0) {
        setSelectedPaymentId(methods[0].id);
      }
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      setError(t('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = async () => {
    if (!cart?.id) return;

    setCalculateLoading(true);
    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      const response = await cartService.calculateCart(cart.id, {
        delivery_type: deliveryType,
        coupon: appliedCoupon || undefined,
        location: selectedAddress?.location,
      });
      setCalculatedPrices(response.data);
    } catch (error) {
      console.error('Error calculating prices:', error);
    } finally {
      setCalculateLoading(false);
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
        setCouponError(tCart('invalidCoupon'));
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || tCart('invalidCoupon'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!cart?.id) return;
    
    // Validate
    if (deliveryType === 'delivery' && !selectedAddressId) {
      setError(t('selectAddressError'));
      return;
    }
    
    if (!selectedPaymentId) {
      setError(t('selectPaymentError'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      
      // Create order
      const orderResponse = await orderService.createOrder({
        cart_id: cart.id,
        delivery_type: deliveryType,
        address_id: deliveryType === 'delivery' ? selectedAddressId! : undefined,
        delivery_date: deliveryDate || undefined,
        delivery_time: deliveryTime || undefined,
        note: orderNote || undefined,
        coupon: appliedCoupon || undefined,
        payment_id: selectedPaymentId!,
        location: selectedAddress?.location,
      });

      const orderId = orderResponse.data.id;

      // Create payment transaction
      const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
      
      if (selectedPayment?.tag !== 'cash') {
        // For non-cash payments, create transaction and get payment URL
        await orderService.createTransaction(orderId, {
          payment_sys_id: selectedPaymentId!,
        });

        // Process payment (redirect to payment gateway)
        const paymentResponse = await orderService.processPayment(selectedPayment!.tag, orderId);
        if (paymentResponse.data?.payment_url) {
          window.location.href = paymentResponse.data.payment_url;
          return;
        }
      }

      // Clear cart and redirect to order success
      clearCart();
      router.push(`/orders/${orderId}?success=true`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || t('orderError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentName = (tag: string): string => {
    switch (tag) {
      case 'cash':
        return t('cash');
      case 'wallet':
        return t('wallet');
      case 'stripe':
      case 'paypal':
      case 'card':
        return t('card');
      default:
        return tag;
    }
  };

  const getPaymentIcon = (tag: string): React.ReactNode => {
    switch (tag) {
      case 'cash':
        return <Banknote size={24} />;
      case 'wallet':
        return <Wallet size={24} />;
      default:
        return <CreditCard size={24} />;
    }
  };

  // Get cart items
  const cartItems: CartDetail[] = cart?.user_carts?.flatMap(uc => uc.cart_details || uc.cartDetails || []) || [];
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Generate available delivery dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? t('today') : i === 1 ? t('tomorrow') : date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      });
    }
    return dates;
  };

  // Generate available times
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 22; hour++) {
      times.push({
        value: `${hour}:00`,
        label: `${hour}:00 - ${hour + 1}:00`,
      });
    }
    return times;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] py-8">
        <div className="container max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-[var(--border)] rounded" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] p-6">
                <div className="h-6 w-40 bg-[var(--border)] rounded mb-4" />
                <div className="h-20 w-full bg-[var(--border)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center py-16">
        <EmptyState
          type="cart"
          title={tCart('empty')}
          description={tCart('emptySubtitle')}
          action={{
            label: tCart('browsShops'),
            onClick: () => router.push('/shops'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)] py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-[var(--main-bg)] transition-colors"
          >
            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--black)]">{t('title')}</h1>
            <p className="text-sm text-[var(--text-grey)]">
              {itemCount} {tCart('items')} • {cart.shop?.translation?.title}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-[var(--radius-lg)] flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-[var(--error)]" />
              <p className="text-[var(--error)] font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Type */}
            <Card>
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('deliveryType')}</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                    deliveryType === 'delivery'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  )}
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    deliveryType === 'delivery' ? 'bg-[var(--primary)]/20' : 'bg-[var(--main-bg)]'
                  )}>
                    <Truck size={24} className={deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'} />
                  </div>
                  <div className="text-start">
                    <p className={clsx(
                      'font-bold',
                      deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                    )}>
                      {t('homeDelivery')}
                    </p>
                    <p className="text-sm text-[var(--text-grey)]">{t('deliverToYou')}</p>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="ms-auto w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                    deliveryType === 'pickup'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  )}
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    deliveryType === 'pickup' ? 'bg-[var(--primary)]/20' : 'bg-[var(--main-bg)]'
                  )}>
                    <Store size={24} className={deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'} />
                  </div>
                  <div className="text-start">
                    <p className={clsx(
                      'font-bold',
                      deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                    )}>
                      {t('pickup')}
                    </p>
                    <p className="text-sm text-[var(--text-grey)]">{t('pickupFromStore')}</p>
                  </div>
                  {deliveryType === 'pickup' && (
                    <div className="ms-auto w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              </div>
            </Card>

            {/* Delivery Address - Only show for delivery type */}
            {deliveryType === 'delivery' && (
              <Card>
                <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('deliveryAddress')}</h2>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--main-bg)] rounded-full flex items-center justify-center">
                      <MapPin size={32} className="text-[var(--text-grey)]" />
                    </div>
                    <p className="text-[var(--text-grey)] mb-4">{t('noAddresses')}</p>
                    <Button variant="outline" leftIcon={<Plus size={18} />}>
                      {t('addAddress')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={clsx(
                          'w-full flex items-start gap-4 p-4 rounded-[var(--radius-lg)] border-2 transition-all text-start',
                          selectedAddressId === address.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        )}
                      >
                        <div className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                          selectedAddressId === address.id ? 'bg-[var(--primary)]/20' : 'bg-[var(--main-bg)]'
                        )}>
                          <MapPin size={20} className={selectedAddressId === address.id ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={clsx(
                              'font-bold',
                              selectedAddressId === address.id ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                            )}>
                              {address.title || t('address')}
                            </p>
                            {address.active && (
                              <Badge variant="primary" size="sm">{tCommon('default')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[var(--text-grey)] mt-1 line-clamp-2">
                            {address.address}
                          </p>
                        </div>
                        {selectedAddressId === address.id && (
                          <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* Add New Address Button */}
                    <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-grey)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                      <Plus size={20} />
                      <span className="font-medium">{t('addAddress')}</span>
                    </button>
                  </div>
                )}
              </Card>
            )}

            {/* Delivery Time (Optional) */}
            <Card>
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('deliveryTime')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--black)] mb-2 block">
                    {t('selectDate')}
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-grey)]" />
                    <select
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full ps-12 pe-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-white appearance-none cursor-pointer focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                    >
                      <option value="">{t('asap')}</option>
                      {getAvailableDates().map(date => (
                        <option key={date.value} value={date.value}>{date.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--black)] mb-2 block">
                    {t('selectTime')}
                  </label>
                  <div className="relative">
                    <Clock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-grey)]" />
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full ps-12 pe-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-white appearance-none cursor-pointer focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                      disabled={!deliveryDate}
                    >
                      <option value="">{deliveryDate ? t('selectTimeSlot') : t('selectDateFirst')}</option>
                      {deliveryDate && getAvailableTimes().map(time => (
                        <option key={time.value} value={time.value}>{time.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card>
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('paymentMethod')}</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentId(method.id)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                      selectedPaymentId === method.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    )}
                  >
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      selectedPaymentId === method.id ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--main-bg)] text-[var(--text-grey)]'
                    )}>
                      {method.icon}
                    </div>
                    <span className={clsx(
                      'font-bold',
                      selectedPaymentId === method.id ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                    )}>
                      {method.name}
                    </span>
                    {selectedPaymentId === method.id && (
                      <div className="ms-auto w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Order Notes */}
            <Card>
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('orderNotes')}</h2>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t('orderNotesPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-white resize-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
              />
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('orderSummary')}</h2>

              {/* Shop Info */}
              {cart.shop && (
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                  {cart.shop.logo_img && (
                    <Image
                      src={cart.shop.logo_img}
                      alt={cart.shop.translation?.title || ''}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-bold text-[var(--black)]">{cart.shop.translation?.title}</p>
                    <p className="text-sm text-[var(--text-grey)]">{itemCount} {tCart('items')}</p>
                  </div>
                </div>
              )}

              {/* Cart Items Preview */}
              <div className="py-4 border-b border-[var(--border)] space-y-3 max-h-48 overflow-y-auto">
                {cartItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-grey)]">
                      {item.quantity}x {t('item')} #{item.stock?.id}
                    </span>
                    <span className="text-[var(--black)] font-medium">
                      {tCommon('sar')} {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {cartItems.length > 5 && (
                  <p className="text-sm text-[var(--text-grey)]">
                    +{cartItems.length - 5} {t('moreItems')}
                  </p>
                )}
              </div>

              {/* Coupon */}
              <div className="py-4 border-b border-[var(--border)]">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-[var(--success-light)] rounded-[var(--radius-md)]">
                    <div className="flex items-center gap-2">
                      <Ticket size={18} className="text-[var(--success)]" />
                      <span className="text-sm font-medium text-[var(--success)]">
                        {tCart('couponApplied')}: {appliedCoupon}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-sm text-[var(--error)] hover:underline"
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={tCart('couponCode')}
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
                      {tCart('apply')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">{tCart('subtotal')}</span>
                  <span className="text-[var(--black)]">
                    {tCommon('sar')} {subtotal.toFixed(2)}
                  </span>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">{tCart('deliveryFee')}</span>
                    <span className="text-[var(--black)]">
                      {calculateLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : calculatedPrices?.delivery_fee ? (
                        `${tCommon('sar')} ${calculatedPrices.delivery_fee.toFixed(2)}`
                      ) : (
                        t('calculated')
                      )}
                    </span>
                  </div>
                )}

                {calculatedPrices?.service_fee && calculatedPrices.service_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">{tCart('serviceFee')}</span>
                    <span className="text-[var(--black)]">
                      {tCommon('sar')} {calculatedPrices.service_fee.toFixed(2)}
                    </span>
                  </div>
                )}

                {calculatedPrices?.tax && calculatedPrices.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">{t('tax')}</span>
                    <span className="text-[var(--black)]">
                      {tCommon('sar')} {calculatedPrices.tax.toFixed(2)}
                    </span>
                  </div>
                )}

                {(calculatedPrices?.discount || calculatedPrices?.coupon_price) && (
                  <div className="flex justify-between text-sm text-[var(--success)]">
                    <span>{tCart('discount')}</span>
                    <span>
                      -{tCommon('sar')} {((calculatedPrices.discount || 0) + (calculatedPrices.coupon_price || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between py-4 border-t border-[var(--border)]">
                <span className="text-lg font-bold text-[var(--black)]">{tCart('total')}</span>
                <span className="text-lg font-bold text-[var(--primary)]">
                  {tCommon('sar')} {(calculatedPrices?.total_price || cart.total_price || subtotal).toFixed(2)}
                </span>
              </div>

              {/* Place Order Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handlePlaceOrder}
                isLoading={submitting}
                disabled={
                  (deliveryType === 'delivery' && !selectedAddressId) ||
                  !selectedPaymentId ||
                  submitting
                }
                rightIcon={isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              >
                {t('placeOrder')}
              </Button>

              {/* Back to Cart */}
              <Link href="/cart" className="block mt-4">
                <Button variant="ghost" fullWidth>
                  {tCommon('back')} {tCommon('cart')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
