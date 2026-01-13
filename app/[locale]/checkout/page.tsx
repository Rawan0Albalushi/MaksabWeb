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

import { Button, Card, Input, Badge, EmptyState, Modal } from '@/components/ui';
import { cartService, orderService, userService } from '@/services';
import { Cart, CartDetail, Address, CalculateResult, SavedCard } from '@/types';
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

  // Thawani Payment States
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [otpVerificationUrl, setOtpVerificationUrl] = useState<string | null>(null);

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

  // Fetch saved cards when Thawani payment is selected
  useEffect(() => {
    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
    if (selectedPayment?.tag === 'thawani') {
      fetchSavedCards();
    }
  }, [selectedPaymentId, paymentMethods]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Always fetch fresh cart from API to validate it's still valid
      try {
        const cartResponse = await cartService.getCart();
        if (cartResponse.data) {
          setCart(cartResponse.data);
        } else {
          // No cart data returned - clear old cart and redirect
          clearCart();
          router.push(`/${locale}/cart`);
          return;
        }
      } catch (cartError: any) {
        // Cart not found (404) or other error - clear old cart
        if (cartError?.response?.status === 404) {
          console.log('Cart not found, clearing old cart data');
          clearCart();
          router.push(`/${locale}/cart`);
          return;
        }
        throw cartError;
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
    
    // Skip calculation if no address selected for delivery
    if (deliveryType === 'delivery' && !selectedAddressId) return;

    setCalculateLoading(true);
    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      
      // Format location - handle both array and object formats from API
      let formattedLocation: { latitude: number; longitude: number } | undefined;
      if (selectedAddress?.location) {
        if (Array.isArray(selectedAddress.location)) {
          // API returns location as [latitude, longitude] array
          formattedLocation = {
            latitude: selectedAddress.location[0],
            longitude: selectedAddress.location[1],
          };
        } else if (typeof selectedAddress.location === 'object') {
          // Location is already an object
          formattedLocation = selectedAddress.location as { latitude: number; longitude: number };
        }
      }
      
      const calculateData = {
        delivery_type: deliveryType,
        coupon: appliedCoupon || undefined,
        location: formattedLocation,
      };
      console.log('📊 Calculating prices with data:', JSON.stringify(calculateData, null, 2));
      
      const response = await cartService.calculateCart(cart.id, calculateData);
      setCalculatedPrices(response.data);
    } catch (error: any) {
      console.error('Error calculating prices:', error);
      console.error('Calculate error response:', error?.response?.data);
      console.error('Calculate error params:', error?.response?.data?.params);
      // Reset calculated prices on error
      setCalculatedPrices(null);
    } finally {
      setCalculateLoading(false);
    }
  };

  const fetchSavedCards = async () => {
    setLoadingCards(true);
    try {
      const response = await orderService.getSavedCards();
      setSavedCards(response.data || []);
      // Auto-select default card if available
      const defaultCard = response.data?.find(c => c.is_default);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
        setUseNewCard(false);
      }
    } catch (error: any) {
      // 404 means the endpoint doesn't exist - that's okay, just show no saved cards
      if (error?.response?.status !== 404) {
        console.error('Error fetching saved cards:', error);
      }
      setSavedCards([]);
      setUseNewCard(true); // Default to new card
    } finally {
      setLoadingCards(false);
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

    // For Thawani with saved card, validate card selection
    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
    if (selectedPayment?.tag === 'thawani' && !useNewCard && !selectedCardId) {
      setError(t('selectCardError'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      
      // Format location - handle both array and object formats from API
      let formattedLocation: { latitude: number; longitude: number } | undefined;
      if (selectedAddress?.location) {
        if (Array.isArray(selectedAddress.location)) {
          // API returns location as [latitude, longitude] array
          formattedLocation = {
            latitude: selectedAddress.location[0],
            longitude: selectedAddress.location[1],
          };
        } else {
          // Location is already an object
          formattedLocation = selectedAddress.location;
        }
      }
      
      // Build order data
      const orderData: {
        cart_id: number;
        delivery_type: 'delivery' | 'pickup';
        address_id?: number;
        delivery_date?: string;
        delivery_time?: string;
        note?: string;
        coupon?: string;
        payment_id: number;
        payment_method_id?: string;
        shop_id?: number;
        location?: { latitude: number; longitude: number };
      } = {
        cart_id: cart.id,
        delivery_type: deliveryType,
        address_id: deliveryType === 'delivery' ? selectedAddressId! : undefined,
        delivery_date: deliveryDate || undefined,
        delivery_time: deliveryTime || undefined,
        note: orderNote || undefined,
        coupon: appliedCoupon || undefined,
        payment_id: selectedPaymentId!,
        shop_id: cart.shop_id,
        location: formattedLocation,
      };

      // Add payment_method_id for saved card
      if (selectedPayment?.tag === 'thawani' && !useNewCard && selectedCardId) {
        orderData.payment_method_id = selectedCardId;
      }

      // Debug: Log order data being sent
      console.log('📤 Creating order with data:', JSON.stringify(orderData, null, 2));

      // Create order - API returns payment_url or otp_verification_url
      const orderResponse = await orderService.createOrder(orderData);
      const { id: orderId, payment_url, otp_verification_url } = orderResponse.data;

      // Handle different payment scenarios
      if (selectedPayment?.tag === 'cash' || selectedPayment?.tag === 'wallet') {
        // Cash or wallet payment - redirect to order success
        clearCart();
        router.push(`/orders/${orderId}?success=true`);
        return;
      }

      if (selectedPayment?.tag === 'thawani') {
        // Scenario A: New card - redirect to Thawani payment page
        if (useNewCard && payment_url) {
          // Save pending order ID for when user returns from payment
          localStorage.setItem('pending_order_id', orderId.toString());
          localStorage.setItem('pending_order_time', Date.now().toString());
          window.location.href = payment_url;
          return;
        }

        // Scenario B: Saved card - show OTP verification
        if (!useNewCard && otp_verification_url) {
          setPendingOrderId(orderId);
          setOtpVerificationUrl(otp_verification_url);
          setShowOtpModal(true);
          setSubmitting(false);
          return;
        }

        // Fallback: If payment_url exists, redirect to it
        if (payment_url) {
          window.location.href = payment_url;
          return;
        }
      }

      // For other payment methods (stripe, paypal, etc.)
      if (payment_url) {
        window.location.href = payment_url;
        return;
      }

      // If no payment URL, try the old flow
      if (selectedPayment?.tag && selectedPayment.tag !== 'cash') {
        await orderService.createTransaction(orderId, {
          payment_sys_id: selectedPaymentId!,
        });

        const paymentResponse = await orderService.processPayment(selectedPayment.tag, orderId);
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
      console.error('Error response:', error?.response?.data);
      console.error('Error params:', error?.response?.data?.params);
      console.error('Full error data:', JSON.stringify(error?.response?.data, null, 2));
      
      // Extract error message from API response
      const apiMessage = error?.response?.data?.message;
      const apiErrors = error?.response?.data?.errors || error?.response?.data?.params;
      
      let errorMessage = t('orderError');
      if (apiMessage) {
        errorMessage = apiMessage;
      } else if (apiErrors && typeof apiErrors === 'object') {
        // Handle validation errors
        const firstError = Object.values(apiErrors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0] as string;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification for saved card payment
  const handleVerifyOtp = async () => {
    if (!pendingOrderId || !otpCode.trim()) {
      setOtpError(t('enterOtpCode'));
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      // If we have an OTP verification URL, redirect to it with OTP
      if (otpVerificationUrl) {
        // The OTP verification might be handled via redirect
        const verificationUrl = new URL(otpVerificationUrl);
        verificationUrl.searchParams.set('otp', otpCode);
        window.location.href = verificationUrl.toString();
        return;
      }

      // Otherwise, verify via API
      const response = await orderService.verifyPaymentOTP(pendingOrderId, otpCode);
      
      if (response.data?.status) {
        // OTP verified successfully
        setShowOtpModal(false);
        clearCart();
        router.push(`/orders/${pendingOrderId}?success=true`);
      } else {
        setOtpError(response.data?.message || t('invalidOtp'));
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setOtpError(error.response?.data?.message || t('otpVerificationFailed'));
    } finally {
      setOtpVerifying(false);
    }
  };

  // Close OTP modal and cancel payment
  const handleCancelOtpVerification = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpError('');
    setPendingOrderId(null);
    setOtpVerificationUrl(null);
  };

  const getPaymentName = (tag: string): string => {
    switch (tag) {
      case 'cash':
        return t('cash');
      case 'wallet':
        return t('wallet');
      case 'thawani':
        return t('thawani');
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
      case 'thawani':
        return <CreditCard size={24} />;
      default:
        return <CreditCard size={24} />;
    }
  };

  // Check if current payment method is Thawani
  const isThawaniPayment = (): boolean => {
    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
    return selectedPayment?.tag === 'thawani';
  };

  // Get card brand icon
  const getCardBrandIcon = (brand: string): string => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 Amex';
      default:
        return '💳 ' + brand;
    }
  };

  // Format address for display - handles both string and object formats
  const formatAddress = (addr: Address): string => {
    if (!addr.address) return '';
    
    // If address is a string, return it directly
    if (typeof addr.address === 'string') {
      return addr.address;
    }
    
    // If address is an object with {address, floor, house}
    const addressObj = addr.address as { address?: string; floor?: string; house?: string };
    const parts: string[] = [];
    if (addressObj.address) parts.push(addressObj.address);
    if (addressObj.house) parts.push(addressObj.house);
    if (addressObj.floor) parts.push(addressObj.floor);
    
    return parts.join(' - ') || '';
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
                            {formatAddress(address)}
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

            {/* Saved Cards Section (Thawani) */}
            {isThawaniPayment() && (
              <Card>
                <h2 className="text-lg font-bold text-[var(--black)] mb-4">{t('selectPaymentCard')}</h2>
                
                {loadingCards ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Use New Card Option */}
                    <button
                      onClick={() => {
                        setUseNewCard(true);
                        setSelectedCardId(null);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                        useNewCard
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      )}
                    >
                      <div className={clsx(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        useNewCard ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--main-bg)] text-[var(--text-grey)]'
                      )}>
                        <Plus size={24} />
                      </div>
                      <div className="text-start">
                        <span className={clsx(
                          'font-bold',
                          useNewCard ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                        )}>
                          {t('useNewCard')}
                        </span>
                        <p className="text-sm text-[var(--text-grey)]">{t('enterCardDetails')}</p>
                      </div>
                      {useNewCard && (
                        <div className="ms-auto w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>

                    {/* Saved Cards */}
                    {savedCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setUseNewCard(false);
                          setSelectedCardId(card.id);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                          !useNewCard && selectedCardId === card.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        )}
                      >
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          !useNewCard && selectedCardId === card.id ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--main-bg)] text-[var(--text-grey)]'
                        )}>
                          <CreditCard size={24} />
                        </div>
                        <div className="text-start flex-1">
                          <span className={clsx(
                            'font-bold',
                            !useNewCard && selectedCardId === card.id ? 'text-[var(--primary)]' : 'text-[var(--black)]'
                          )}>
                            {getCardBrandIcon(card.brand)}
                          </span>
                          <p className="text-sm text-[var(--text-grey)]">
                            •••• •••• •••• {card.last_four} | {card.exp_month}/{card.exp_year}
                          </p>
                        </div>
                        {card.is_default && (
                          <Badge variant="primary" size="sm">{tCommon('default')}</Badge>
                        )}
                        {!useNewCard && selectedCardId === card.id && (
                          <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}

                    {savedCards.length === 0 && (
                      <p className="text-center text-sm text-[var(--text-grey)] py-4">
                        {t('noSavedCards')}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

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

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={handleCancelOtpVerification}
        title={t('otpVerification')}
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
              <CreditCard size={32} className="text-[var(--primary)]" />
            </div>
            <p className="text-[var(--text-grey)]">{t('enterOtpDescription')}</p>
          </div>

          <div>
            <Input
              label={t('otpCode')}
              placeholder={t('enterOtpPlaceholder')}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value);
                setOtpError('');
              }}
              error={otpError}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCancelOtpVerification}
              disabled={otpVerifying}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleVerifyOtp}
              isLoading={otpVerifying}
              disabled={!otpCode.trim() || otpCode.length < 4}
            >
              {t('verifyOtp')}
            </Button>
          </div>

          <p className="text-center text-sm text-[var(--text-grey)]">
            {t('otpNotReceived')}{' '}
            <button className="text-[var(--primary)] font-medium hover:underline">
              {t('resendOtp')}
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
