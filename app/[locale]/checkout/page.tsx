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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-56 bg-gradient-to-r from-slate-200 to-slate-100 rounded-xl" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="h-6 w-44 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg mb-5" />
                <div className="h-24 w-full bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-16 px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10"
        >
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 hover:shadow-md transition-all duration-200"
          >
            {isRTL ? <ChevronRight size={22} className="text-slate-600" /> : <ChevronLeft size={22} className="text-slate-600" />}
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {itemCount} {tCart('items')} • {cart.shop?.translation?.title}
            </p>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-8 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Delivery Type */}
            <Card variant="elevated">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <Truck size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('deliveryType')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={clsx(
                    'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200',
                    deliveryType === 'delivery'
                      ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                      : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                  )}
                >
                  <div className={clsx(
                    'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all',
                    deliveryType === 'delivery' ? 'bg-[var(--primary)]/20' : 'bg-slate-100'
                  )}>
                    <Truck size={26} className={deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-slate-400'} />
                  </div>
                  <div className="text-start flex-1 min-w-0">
                    <p className={clsx(
                      'font-bold text-base',
                      deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-slate-700'
                    )}>
                      {t('homeDelivery')}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{t('deliverToYou')}</p>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30 shrink-0">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={clsx(
                    'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200',
                    deliveryType === 'pickup'
                      ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                      : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                  )}
                >
                  <div className={clsx(
                    'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all',
                    deliveryType === 'pickup' ? 'bg-[var(--primary)]/20' : 'bg-slate-100'
                  )}>
                    <Store size={26} className={deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-slate-400'} />
                  </div>
                  <div className="text-start flex-1 min-w-0">
                    <p className={clsx(
                      'font-bold text-base',
                      deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-slate-700'
                    )}>
                      {t('pickup')}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{t('pickupFromStore')}</p>
                  </div>
                  {deliveryType === 'pickup' && (
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30 shrink-0">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              </div>
            </Card>

            {/* Delivery Address - Only show for delivery type */}
            {deliveryType === 'delivery' && (
              <Card variant="elevated">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{t('deliveryAddress')}</h2>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center">
                      <MapPin size={36} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 mb-5">{t('noAddresses')}</p>
                    <Button variant="outline" leftIcon={<Plus size={18} />}>
                      {t('addAddress')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={clsx(
                          'w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-start',
                          selectedAddressId === address.id
                            ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                            : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                        )}
                      >
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all',
                          selectedAddressId === address.id ? 'bg-[var(--primary)]/20' : 'bg-slate-100'
                        )}>
                          <MapPin size={22} className={selectedAddressId === address.id ? 'text-[var(--primary)]' : 'text-slate-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={clsx(
                              'font-bold text-base',
                              selectedAddressId === address.id ? 'text-[var(--primary)]' : 'text-slate-700'
                            )}>
                              {address.title || t('address')}
                            </p>
                            {address.active && (
                              <Badge variant="primary" size="sm">{tCommon('default')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {formatAddress(address)}
                          </p>
                        </div>
                        {selectedAddressId === address.id && (
                          <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-md shadow-[var(--primary)]/30">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* Add New Address Button */}
                    <button className="w-full flex items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all duration-200">
                      <Plus size={22} />
                      <span className="font-semibold">{t('addAddress')}</span>
                    </button>
                  </div>
                )}
              </Card>
            )}

            {/* Delivery Time (Optional) */}
            <Card variant="elevated">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('deliveryTime')}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">
                    {t('selectDate')}
                  </label>
                  <div className="relative">
                    <Calendar size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full ps-12 pe-5 py-4 border-2 border-slate-200 rounded-xl bg-white appearance-none cursor-pointer focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all text-slate-700 font-medium"
                    >
                      <option value="">{t('asap')}</option>
                      {getAvailableDates().map(date => (
                        <option key={date.value} value={date.value}>{date.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">
                    {t('selectTime')}
                  </label>
                  <div className="relative">
                    <Clock size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full ps-12 pe-5 py-4 border-2 border-slate-200 rounded-xl bg-white appearance-none cursor-pointer focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all text-slate-700 font-medium disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
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
            <Card variant="elevated">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('paymentMethod')}</h2>
              </div>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentId(method.id)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200',
                      selectedPaymentId === method.id
                        ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                        : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                    )}
                  >
                    <div className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                      selectedPaymentId === method.id ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-slate-100 text-slate-400'
                    )}>
                      {method.icon}
                    </div>
                    <span className={clsx(
                      'font-bold text-base',
                      selectedPaymentId === method.id ? 'text-[var(--primary)]' : 'text-slate-700'
                    )}>
                      {method.name}
                    </span>
                    {selectedPaymentId === method.id && (
                      <div className="ms-auto w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Saved Cards Section (Thawani) */}
            {isThawaniPayment() && (
              <Card variant="elevated">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Wallet size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{t('selectPaymentCard')}</h2>
                </div>
                
                {loadingCards ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Use New Card Option */}
                    <button
                      onClick={() => {
                        setUseNewCard(true);
                        setSelectedCardId(null);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200',
                        useNewCard
                          ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                          : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                      )}
                    >
                      <div className={clsx(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                        useNewCard ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-slate-100 text-slate-400'
                      )}>
                        <Plus size={26} />
                      </div>
                      <div className="text-start flex-1 min-w-0">
                        <span className={clsx(
                          'font-bold text-base block',
                          useNewCard ? 'text-[var(--primary)]' : 'text-slate-700'
                        )}>
                          {t('useNewCard')}
                        </span>
                        <p className="text-sm text-slate-500 mt-0.5">{t('enterCardDetails')}</p>
                      </div>
                      {useNewCard && (
                        <div className="ms-auto w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30">
                          <Check size={16} className="text-white" />
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
                          'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200',
                          !useNewCard && selectedCardId === card.id
                            ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-md shadow-[var(--primary)]/10'
                            : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-slate-50'
                        )}
                      >
                        <div className={clsx(
                          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                          !useNewCard && selectedCardId === card.id ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-slate-100 text-slate-400'
                        )}>
                          <CreditCard size={26} />
                        </div>
                        <div className="text-start flex-1 min-w-0">
                          <span className={clsx(
                            'font-bold text-base block',
                            !useNewCard && selectedCardId === card.id ? 'text-[var(--primary)]' : 'text-slate-700'
                          )}>
                            {getCardBrandIcon(card.brand)}
                          </span>
                          <p className="text-sm text-slate-500 mt-0.5 font-mono">
                            •••• •••• •••• {card.last_four} | {card.exp_month}/{card.exp_year}
                          </p>
                        </div>
                        {card.is_default && (
                          <Badge variant="primary" size="sm">{tCommon('default')}</Badge>
                        )}
                        {!useNewCard && selectedCardId === card.id && (
                          <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}

                    {savedCards.length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-xl">
                        {t('noSavedCards')}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Order Notes */}
            <Card variant="elevated">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('orderNotes')}</h2>
              </div>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t('orderNotesPlaceholder')}
                rows={4}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-white resize-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all text-slate-700 placeholder:text-slate-400"
              />
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated" className="sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('orderSummary')}</h2>
              </div>

              {/* Shop Info */}
              {cart.shop && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl mb-5">
                  {cart.shop.logo_img && (
                    <Image
                      src={cart.shop.logo_img}
                      alt={cart.shop.translation?.title || ''}
                      width={56}
                      height={56}
                      className="rounded-xl shadow-sm"
                    />
                  )}
                  <div>
                    <p className="font-bold text-slate-800">{cart.shop.translation?.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{itemCount} {tCart('items')}</p>
                  </div>
                </div>
              )}

              {/* Cart Items Preview */}
              <div className="py-5 border-y border-slate-200 space-y-3 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {cartItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm px-1">
                    <span className="text-slate-500">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-md text-xs font-bold text-slate-600 me-2">
                        {item.quantity}
                      </span>
                      {t('item')} #{item.stock?.id}
                    </span>
                    <span className="text-slate-700 font-semibold">
                      {tCommon('sar')} {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {cartItems.length > 5 && (
                  <p className="text-sm text-slate-400 text-center pt-2">
                    +{cartItems.length - 5} {t('moreItems')}
                  </p>
                )}
              </div>

              {/* Coupon */}
              <div className="py-5 border-b border-slate-200">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Ticket size={18} className="text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {tCart('couponApplied')}: {appliedCoupon}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline transition-colors"
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
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
                      className="shrink-0"
                    >
                      {tCart('apply')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="py-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{tCart('subtotal')}</span>
                  <span className="text-slate-700 font-medium">
                    {tCommon('sar')} {subtotal.toFixed(2)}
                  </span>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{tCart('deliveryFee')}</span>
                    <span className="text-slate-700 font-medium">
                      {calculateLoading ? (
                        <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                      ) : calculatedPrices?.delivery_fee ? (
                        `${tCommon('sar')} ${calculatedPrices.delivery_fee.toFixed(2)}`
                      ) : (
                        <span className="text-slate-400 italic">{t('calculated')}</span>
                      )}
                    </span>
                  </div>
                )}

                {calculatedPrices?.service_fee && calculatedPrices.service_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{tCart('serviceFee')}</span>
                    <span className="text-slate-700 font-medium">
                      {tCommon('sar')} {calculatedPrices.service_fee.toFixed(2)}
                    </span>
                  </div>
                )}

                {calculatedPrices?.tax && calculatedPrices.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('tax')}</span>
                    <span className="text-slate-700 font-medium">
                      {tCommon('sar')} {calculatedPrices.tax.toFixed(2)}
                    </span>
                  </div>
                )}

                {(calculatedPrices?.discount || calculatedPrices?.coupon_price) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">{tCart('discount')}</span>
                    <span className="text-emerald-600 font-semibold">
                      -{tCommon('sar')} {((calculatedPrices.discount || 0) + (calculatedPrices.coupon_price || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between py-5 border-t-2 border-slate-200 mb-6">
                <span className="text-xl font-bold text-slate-800">{tCart('total')}</span>
                <span className="text-xl font-bold text-[var(--primary)]">
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
                className="shadow-lg shadow-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/40 transition-all"
              >
                {t('placeOrder')}
              </Button>

              {/* Back to Cart */}
              <Link href="/cart" className="block mt-4">
                <Button variant="ghost" fullWidth className="text-slate-500 hover:text-slate-700">
                  {tCommon('back')} {tCommon('cart')}
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={handleCancelOtpVerification}
        title={t('otpVerification')}
      >
        <div className="space-y-8 p-2">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
              <CreditCard size={36} className="text-[var(--primary)]" />
            </div>
            <p className="text-slate-500 leading-relaxed">{t('enterOtpDescription')}</p>
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
              className="text-center text-2xl tracking-[0.5em] font-bold"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCancelOtpVerification}
              disabled={otpVerifying}
              className="border-2"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleVerifyOtp}
              isLoading={otpVerifying}
              disabled={!otpCode.trim() || otpCode.length < 4}
              className="shadow-lg shadow-[var(--primary)]/30"
            >
              {t('verifyOtp')}
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500">
            {t('otpNotReceived')}{' '}
            <button className="text-[var(--primary)] font-semibold hover:underline transition-all">
              {t('resendOtp')}
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
