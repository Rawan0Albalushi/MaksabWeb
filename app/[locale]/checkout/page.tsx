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
  Shield,
  Package,
  Sparkles,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Card, Input, Badge, EmptyState, Modal } from '@/components/ui';
import { cartService, orderService, userService, settingsService } from '@/services';
import { Cart, CartDetail, Address, CalculateResult, SavedCard, Currency } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore } from '@/store';

interface PaymentMethod {
  id: number;
  tag: string;
  name: string;
  icon: React.ReactNode;
  input?: number;
}

// Checkout Steps
const CHECKOUT_STEPS = [
  { id: 'delivery', icon: Truck },
  { id: 'address', icon: MapPin },
  { id: 'payment', icon: CreditCard },
  { id: 'confirm', icon: Check },
];

const CheckoutPage = () => {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale, currency, currencies, setCurrency, setCurrencies } = useSettingsStore();
  const isRTL = locale === 'ar';

  const { user, isAuthenticated } = useAuthStore();
  const { cart, setCart, clearCart } = useCartStore();

  // Currency state
  const [activeCurrency, setActiveCurrency] = useState<Currency | null>(null);

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

      // Fetch currencies if not already loaded
      if (!currency || currencies.length === 0) {
        try {
          const currencyResponse = await settingsService.getCurrencies();
          console.log('💰 Fetched currencies:', currencyResponse.data);
          if (currencyResponse.data && currencyResponse.data.length > 0) {
            setCurrencies(currencyResponse.data);
            // Find default currency or use first one
            const defaultCurrency = currencyResponse.data.find(c => c.is_default) || currencyResponse.data[0];
            console.log('💰 Using default currency:', defaultCurrency);
            setCurrency(defaultCurrency);
            setActiveCurrency(defaultCurrency);
          }
        } catch (currencyError) {
          console.error('Error fetching currencies:', currencyError);
        }
      } else {
        console.log('💰 Using existing currency from store:', currency);
        setActiveCurrency(currency);
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
        currency_id: number;
        rate: number;
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
        phone?: string;
      } = {
        cart_id: cart.id,
        currency_id: activeCurrency?.id || currency?.id || 1, // Use active currency from API
        rate: activeCurrency?.rate || currency?.rate || 1, // Use currency rate from API
        delivery_type: deliveryType,
        address_id: deliveryType === 'delivery' ? selectedAddressId! : undefined,
        delivery_date: deliveryDate || undefined,
        delivery_time: deliveryTime || undefined,
        note: orderNote || undefined,
        coupon: appliedCoupon || undefined,
        payment_id: selectedPaymentId!,
        shop_id: cart.shop_id,
        location: formattedLocation,
        phone: user?.phone || undefined,
      };

      // Add payment_method_id for saved card
      if (selectedPayment?.tag === 'thawani' && !useNewCard && selectedCardId) {
        orderData.payment_method_id = selectedCardId;
      }

      // Debug: Log order data being sent
      console.log('💰 Active currency:', activeCurrency);
      console.log('💰 Store currency:', currency);
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

  // Calculate current step - shows which step user is currently on
  const getCurrentStep = () => {
    // Step 0: Delivery Type - always accessible
    // Step 1: Address - only if delivery type is 'delivery'
    // Step 2: Payment Method
    // Step 3: Review/Confirm - reached when all required info is filled
    
    if (!deliveryType) return 0;
    
    if (deliveryType === 'delivery') {
      if (!selectedAddressId) return 1;
    }
    
    if (!selectedPaymentId) return 2;
    
    // All required fields filled - show confirm step as active, not completed
    return 3;
  };

  // Check if a step is completed
  const isStepCompleted = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Delivery Type
        return !!deliveryType;
      case 1: // Address
        return deliveryType === 'pickup' || !!selectedAddressId;
      case 2: // Payment
        return !!selectedPaymentId;
      case 3: // Confirm - never completed until order is placed
        return false;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Loading Header Skeleton */}
        <div className="bg-gradient-to-r from-[#0a1628] via-[#1a3a4a] to-[#0d2233] py-8 sm:py-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl" />
              <div>
                <div className="h-7 w-40 bg-white/10 rounded-lg mb-2" />
                <div className="h-4 w-56 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {/* Steps Skeleton */}
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                  {i < 4 && <div className="w-12 h-1 bg-slate-200 rounded-full hidden sm:block" />}
                </div>
              ))}
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="h-6 w-44 bg-slate-200 rounded-lg mb-5" />
                    <div className="h-32 w-full bg-slate-100 rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
                <div className="h-6 w-32 bg-slate-200 rounded-lg mb-5" />
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-5 w-full bg-slate-100 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
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

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
      {/* Header Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 start-1/4 w-72 h-72 bg-[var(--primary)]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 end-1/4 w-96 h-96 bg-[var(--primary-dark)]/15 rounded-full blur-[120px]" />
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-10 relative z-10">
          {/* Back Button & Title */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6 sm:mb-8"
          >
            <button
              onClick={() => router.back()}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-200 group"
            >
              {isRTL ? <ChevronRight size={20} className="text-white group-hover:scale-110 transition-transform" /> : <ChevronLeft size={20} className="text-white group-hover:scale-110 transition-transform" />}
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{t('title')}</h1>
              <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                {itemCount} {tCart('items')} • {cart.shop?.translation?.title}
              </p>
            </div>
          </motion.div>

          {/* Checkout Steps Indicator - Simple numbered steps */}
          <div className="flex items-center justify-center gap-0">
            {[1, 2, 3, 4].map((stepNum, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              
              return (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={clsx(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all',
                      isPast && 'bg-[var(--primary)] text-white',
                      isActive && 'bg-white text-[var(--primary)]',
                      !isPast && !isActive && 'bg-white/20 text-white/50'
                    )}
                  >
                    {isPast ? <Check size={16} /> : stepNum}
                  </div>
                  
                  {index < 3 && (
                    <div className={clsx(
                      'w-8 sm:w-12 h-1 transition-colors',
                      index < currentStep ? 'bg-[var(--primary)]' : 'bg-white/20'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full h-6 sm:h-10" preserveAspectRatio="none">
            <path d="M0 50L60 46C120 42 240 34 360 30C480 26 600 26 720 28C840 30 960 34 1080 36C1200 38 1320 38 1380 38L1440 38V50H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-10 -mt-2">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-6 px-4 sm:px-5 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-red-600 font-medium text-sm sm:text-base flex-1">{error}</p>
              <button 
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <ChevronRight size={18} className={isRTL ? '' : 'rotate-180'} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Takes 8 columns on large screens */}
          <div className="lg:col-span-8 space-y-4">
            {/* Delivery Type Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Truck size={18} className="text-[var(--primary)]" />
                  {t('deliveryType')}
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={clsx(
                      'p-4 rounded-lg border-2 text-center transition-all',
                      deliveryType === 'delivery'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Truck size={24} className={clsx('mx-auto mb-2', deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-slate-400')} />
                    <p className={clsx('font-semibold text-sm', deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-slate-700')}>
                      {t('homeDelivery')}
                    </p>
                    {deliveryType === 'delivery' && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] mx-auto mt-2 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={clsx(
                      'p-4 rounded-lg border-2 text-center transition-all',
                      deliveryType === 'pickup'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Store size={24} className={clsx('mx-auto mb-2', deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-slate-400')} />
                    <p className={clsx('font-semibold text-sm', deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-slate-700')}>
                      {t('pickup')}
                    </p>
                    {deliveryType === 'pickup' && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] mx-auto mt-2 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Address - Only show for delivery type */}
            {deliveryType === 'delivery' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MapPin size={18} className="text-emerald-500" />
                    {t('deliveryAddress')}
                  </h3>
                </div>
                <div className="p-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <MapPin size={24} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500 mb-3 text-sm">{t('noAddresses')}</p>
                      <Button variant="outline" leftIcon={<Plus size={16} />} size="sm">
                        {t('addAddress')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={clsx(
                            'w-full p-3 rounded-lg border-2 text-start transition-all',
                            selectedAddressId === address.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={clsx('font-semibold text-sm', selectedAddressId === address.id ? 'text-[var(--primary)]' : 'text-slate-700')}>
                                {address.title || t('address')}
                              </span>
                              {address.active && <Badge variant="primary" size="sm">{tCommon('default')}</Badge>}
                            </div>
                            {selectedAddressId === address.id && (
                              <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{formatAddress(address)}</p>
                        </button>
                      ))}
                      <button className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2">
                        <Plus size={16} />
                        <span className="text-sm font-medium">{t('addAddress')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Time */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={18} className="text-violet-500" />
                  {t('deliveryTime')}
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">{t('selectDate')}</label>
                    <select
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    >
                      <option value="">{t('asap')}</option>
                      {getAvailableDates().map(date => (
                        <option key={date.value} value={date.value}>{date.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">{t('selectTime')}</label>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      disabled={!deliveryDate}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">{deliveryDate ? t('selectTimeSlot') : t('selectDateFirst')}</option>
                      {deliveryDate && getAvailableTimes().map(time => (
                        <option key={time.value} value={time.value}>{time.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-500" />
                  {t('paymentMethod')}
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={clsx(
                        'p-3 rounded-lg border-2 text-center transition-all',
                        selectedPaymentId === method.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={clsx('mx-auto mb-1', selectedPaymentId === method.id ? 'text-[var(--primary)]' : 'text-slate-400')}>
                        {method.icon}
                      </div>
                      <span className={clsx('text-sm font-medium', selectedPaymentId === method.id ? 'text-[var(--primary)]' : 'text-slate-700')}>
                        {method.name}
                      </span>
                      {selectedPaymentId === method.id && (
                        <div className="w-4 h-4 rounded-full bg-[var(--primary)] mx-auto mt-1.5 flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Cards Section (Thawani) */}
            {isThawaniPayment() && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wallet size={18} className="text-blue-500" />
                    {t('selectPaymentCard')}
                  </h3>
                </div>
                <div className="p-4">
                  {loadingCards ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => { setUseNewCard(true); setSelectedCardId(null); }}
                        className={clsx(
                          'w-full p-3 rounded-lg border-2 text-start transition-all',
                          useNewCard ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Plus size={18} className={useNewCard ? 'text-[var(--primary)]' : 'text-slate-400'} />
                            <span className={clsx('font-medium text-sm', useNewCard ? 'text-[var(--primary)]' : 'text-slate-700')}>
                              {t('useNewCard')}
                            </span>
                          </div>
                          {useNewCard && (
                            <div className="w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>

                      {savedCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => { setUseNewCard(false); setSelectedCardId(card.id); }}
                          className={clsx(
                            'w-full p-3 rounded-lg border-2 text-start transition-all',
                            !useNewCard && selectedCardId === card.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={clsx('font-medium text-sm', !useNewCard && selectedCardId === card.id ? 'text-[var(--primary)]' : 'text-slate-700')}>
                                {getCardBrandIcon(card.brand)}
                              </span>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">•••• {card.last_four}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {card.is_default && <Badge variant="primary" size="sm">{tCommon('default')}</Badge>}
                              {!useNewCard && selectedCardId === card.id && (
                                <div className="w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}

                      {savedCards.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-4 bg-slate-50 rounded-lg">{t('noSavedCards')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-rose-500" />
                  {t('orderNotes')}
                </h3>
              </div>
              <div className="p-4">
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder={t('orderNotesPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar - Takes 4 columns on large screens */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:sticky lg:top-24">
              {/* Header */}
              <div className="bg-[var(--primary)] text-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} />
                  <h2 className="font-bold">{t('orderSummary')}</h2>
                </div>
                {cart.shop && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
                    {cart.shop.logo_img && (
                      <Image
                        src={cart.shop.logo_img}
                        alt={cart.shop.translation?.title || ''}
                        width={40}
                        height={40}
                        className="rounded-lg w-10 h-10 object-cover bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cart.shop.translation?.title}</p>
                      <p className="text-xs text-white/70">{itemCount} {tCart('items')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Cart Items */}
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded text-xs font-semibold flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <span className="truncate max-w-[120px]">{t('item')} #{item.stock?.id}</span>
                      </span>
                      <span className="text-slate-800 font-medium">
                        {tCommon('sar')} {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">+{cartItems.length - 3} {t('moreItems')}</p>
                  )}
                </div>

                {/* Coupon */}
                <div className="py-4 border-y border-slate-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{appliedCoupon}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-600">
                        {tCommon('delete')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={tCart('couponCode')}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        leftIcon={<Ticket size={14} />}
                        error={couponError}
                        containerClassName="flex-1"
                        className="text-sm py-2"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        isLoading={couponLoading}
                        className="shrink-0 text-sm px-3"
                      >
                        {tCart('apply')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="py-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{tCart('subtotal')}</span>
                    <span className="text-slate-700 font-medium">{tCommon('sar')} {subtotal.toFixed(2)}</span>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{tCart('deliveryFee')}</span>
                      <span className="text-slate-700 font-medium">
                        {calculateLoading ? (
                          <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                        ) : calculatedPrices?.delivery_fee ? (
                          `${tCommon('sar')} ${calculatedPrices.delivery_fee.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400 text-xs">{t('calculated')}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {(calculatedPrices?.discount || calculatedPrices?.coupon_price) && (
                    <div className="flex justify-between text-emerald-600">
                      <span>{tCart('discount')}</span>
                      <span className="font-semibold">
                        -{tCommon('sar')} {((calculatedPrices.discount || 0) + (calculatedPrices.coupon_price || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-4 border-t-2 border-slate-200 bg-slate-50 -mx-5 px-5">
                  <span className="text-base font-bold text-slate-800">{tCart('total')}</span>
                  <span className="text-2xl font-black text-[var(--primary)]">
                    {(calculatedPrices?.total_price || cart.total_price || subtotal).toFixed(2)} {tCommon('sar')}
                  </span>
                </div>
              </div>

              {/* Place Order Button - FIXED AT BOTTOM */}
              <div className="p-4 border-t border-slate-200" style={{ backgroundColor: '#f97316' }}>
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    (deliveryType === 'delivery' && !selectedAddressId) ||
                    !selectedPaymentId ||
                    submitting
                  }
                  style={{
                    backgroundColor: (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId) ? '#cbd5e1' : '#ea580c',
                    color: (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId) ? '#64748b' : '#ffffff',
                  }}
                  className="w-full py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl hover:opacity-90 active:scale-[0.98]"
                >
                  {submitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag size={22} />
                      <span>{t('placeOrder')}</span>
                      {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </>
                  )}
                </button>
                
                {/* Security Badge */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white">
                  <Shield size={14} />
                  <span>دفع آمن ومشفر 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden z-50 shadow-2xl" style={{ backgroundColor: '#ea580c' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/80">{tCart('total')}</span>
          <span className="text-xl font-black text-white">
            {(calculatedPrices?.total_price || cart.total_price || subtotal).toFixed(2)} {tCommon('sar')}
          </span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={
            (deliveryType === 'delivery' && !selectedAddressId) ||
            !selectedPaymentId ||
            submitting
          }
          style={{
            backgroundColor: (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId) ? '#cbd5e1' : '#ffffff',
            color: (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId) ? '#64748b' : '#ea580c',
          }}
          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {submitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <ShoppingBag size={20} />
              <span>{t('placeOrder')}</span>
            </>
          )}
        </button>
      </div>

      {/* Spacer for fixed bottom bar on mobile */}
      <div className="h-32 lg:hidden" />

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={handleCancelOtpVerification}
        title={t('otpVerification')}
      >
        <div className="space-y-6 sm:space-y-8 p-1 sm:p-2">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
              <CreditCard size={32} className="text-[var(--primary)]" />
            </div>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed px-2">{t('enterOtpDescription')}</p>
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
              className="text-center text-xl sm:text-2xl tracking-[0.4em] sm:tracking-[0.5em] font-bold"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>

          <div className="flex gap-3 sm:gap-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCancelOtpVerification}
              disabled={otpVerifying}
              className="border-2 text-sm sm:text-base"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleVerifyOtp}
              isLoading={otpVerifying}
              disabled={!otpCode.trim() || otpCode.length < 4}
              className="shadow-lg shadow-[var(--primary)]/30 text-sm sm:text-base"
            >
              {t('verifyOtp')}
            </Button>
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-500">
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
