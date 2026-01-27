'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  X,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Input, Badge, EmptyState, Modal } from '@/components/ui';
import { cartService, orderService, userService, settingsService } from '@/services';
import type { CartDetail, Address, CalculateResult, SavedCard, Currency } from '@/types';
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
  { id: 'delivery', icon: Truck, label: 'deliveryType' },
  { id: 'address', icon: MapPin, label: 'address' },
  { id: 'time', icon: Clock, label: 'time' },
  { id: 'payment', icon: CreditCard, label: 'payment' },
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
      // Get the base URL for payment callbacks - use API routes for better compatibility
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
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
        // Multiple URL parameter names for better backend compatibility
        success_url?: string;
        cancel_url?: string;
        return_url?: string;
        callback_url?: string;
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
        // Payment callback URLs - use API routes that will redirect to frontend
        // API route format: /api/payment/success?o_id=xxx will redirect to /[locale]/payment/result
        success_url: `${baseUrl}/api/payment/success`,
        cancel_url: `${baseUrl}/api/payment/failed`,
        // Also send alternative parameter names for backend compatibility
        return_url: `${baseUrl}/api/payment/callback`,
        callback_url: `${baseUrl}/api/payment/callback`,
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
        return <Banknote size={22} />;
      case 'wallet':
        return <Wallet size={22} />;
      case 'thawani':
        return <CreditCard size={22} />;
      default:
        return <CreditCard size={22} />;
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

  // Calculate current step
  const getCurrentStep = () => {
    if (!deliveryType) return 0;
    if (deliveryType === 'delivery' && !selectedAddressId) return 1;
    if (!deliveryDate && !deliveryTime) return 2;
    if (!selectedPaymentId) return 3;
    return 4;
  };

  // Check if a step is completed
  const isStepCompleted = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return !!deliveryType;
      case 1: return deliveryType === 'pickup' || !!selectedAddressId;
      case 2: return true; // Time is optional
      case 3: return !!selectedPaymentId;
      default: return false;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
        {/* Loading Header */}
        <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a5c] to-[#0d2233]">
          <div className="container max-w-6xl mx-auto px-4 py-6">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl" />
              <div className="flex-1">
                <div className="h-6 w-40 bg-white/10 rounded-lg mb-2" />
                <div className="h-4 w-56 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Steps skeleton */}
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                  {i < 4 && <div className="w-8 h-0.5 bg-gray-200" />}
                </div>
              ))}
            </div>
            
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="h-6 w-36 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-24 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-5 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 flex items-center justify-center py-16 px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Elegant Header */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#1a3a5c] to-[#0d2233] overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 start-1/4 w-96 h-96 bg-[var(--primary)]/8 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 end-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 py-5 sm:py-6 relative z-10">
          {/* Back & Title Row */}
          <div className="flex items-center justify-between mb-6">
            <motion.div 
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
              >
                {isRTL ? (
                  <ChevronRight size={18} className="text-white group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronLeft size={18} className="text-white group-hover:-translate-x-0.5 transition-transform" />
                )}
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{t('title')}</h1>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5 flex items-center gap-1.5">
                  <Package size={14} />
                  <span>{itemCount} {tCart('items')}</span>
                  <span className="text-white/30">•</span>
                  <span className="truncate max-w-[120px]">{cart.shop?.translation?.title}</span>
                </p>
              </div>
            </motion.div>

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10"
            >
              <Shield size={14} className="text-emerald-400" />
              <span className="text-xs text-white/70">{t('secureCheckout') || 'دفع آمن'}</span>
            </motion.div>
          </div>

          {/* Modern Step Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-1 sm:gap-2"
          >
            {CHECKOUT_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = isStepCompleted(index);
              const isPast = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={clsx(
                      'relative flex flex-col items-center',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300',
                        isCompleted && 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30',
                        isActive && !isCompleted && 'bg-white text-[var(--primary)] shadow-xl shadow-white/20',
                        !isActive && !isCompleted && 'bg-white/10 text-white/40 border border-white/10'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                      ) : (
                        <StepIcon size={18} className="sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className={clsx(
                      'text-[10px] sm:text-xs mt-1.5 font-medium transition-colors',
                      isActive ? 'text-white' : 'text-white/40'
                    )}>
                      {t(step.label)}
                    </span>
                  </motion.div>
                  
                  {index < CHECKOUT_STEPS.length - 1 && (
                    <div className="relative w-6 sm:w-10 h-0.5 mx-1 sm:mx-2 -mt-4">
                      <div className="absolute inset-0 bg-white/10 rounded-full" />
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full origin-left"
                        style={{ transformOrigin: isRTL ? 'right' : 'left' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-red-600 font-medium text-sm flex-1">{error}</p>
              <button 
                onClick={() => setError('')}
                className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form Section - 3 columns */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3 space-y-4"
          >
            {/* Delivery Type Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <Truck size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{t('deliveryType')}</h3>
                    <p className="text-xs text-gray-400">{t('chooseDeliveryMethod') || 'اختر طريقة التوصيل'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Home Delivery */}
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={clsx(
                      'relative p-4 sm:p-5 rounded-xl border-2 text-center transition-all duration-300 group',
                      deliveryType === 'delivery'
                        ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/10'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    )}
                  >
                    <div className={clsx(
                      'w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all',
                      deliveryType === 'delivery'
                        ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    )}>
                      <Truck size={22} />
                    </div>
                    <p className={clsx(
                      'font-semibold text-sm transition-colors',
                      deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-gray-700'
                    )}>
                      {t('homeDelivery')}
                    </p>
                    {deliveryType === 'delivery' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 end-2 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30"
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </button>

                  {/* Store Pickup */}
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={clsx(
                      'relative p-4 sm:p-5 rounded-xl border-2 text-center transition-all duration-300 group',
                      deliveryType === 'pickup'
                        ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/10'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    )}
                  >
                    <div className={clsx(
                      'w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all',
                      deliveryType === 'pickup'
                        ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    )}>
                      <Store size={22} />
                    </div>
                    <p className={clsx(
                      'font-semibold text-sm transition-colors',
                      deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-gray-700'
                    )}>
                      {t('pickup')}
                    </p>
                    {deliveryType === 'pickup' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 end-2 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30"
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Delivery Address Card - Only show for delivery */}
            <AnimatePresence>
              {deliveryType === 'delivery' && (
                <motion.div 
                  variants={itemVariants}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-emerald-50/80 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <MapPin size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{t('deliveryAddress')}</h3>
                        <p className="text-xs text-gray-400">{t('selectDeliveryAddress') || 'اختر عنوان التوصيل'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-200 flex items-center justify-center">
                          <MapPin size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">{t('noAddresses')}</p>
                        <Button variant="outline" leftIcon={<Plus size={16} />} size="sm">
                          {t('addAddress')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {addresses.map((address, index) => (
                          <motion.button
                            key={address.id}
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedAddressId(address.id)}
                            className={clsx(
                              'w-full p-4 rounded-xl border-2 text-start transition-all duration-200',
                              selectedAddressId === address.id
                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-lg shadow-emerald-500/10'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={clsx(
                                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                                  selectedAddressId === address.id
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                )}>
                                  <Home size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={clsx(
                                      'font-semibold text-sm',
                                      selectedAddressId === address.id ? 'text-emerald-600' : 'text-gray-700'
                                    )}>
                                      {address.title || t('address')}
                                    </span>
                                    {address.active && (
                                      <Badge variant="primary" size="sm" className="!text-[10px]">{tCommon('default')}</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{formatAddress(address)}</p>
                                </div>
                              </div>
                              {selectedAddressId === address.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                                >
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                        
                        {/* Add New Address Button */}
                        <button className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 group">
                          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                          <span className="text-sm font-medium">{t('addAddress')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delivery Time Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-50/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Clock size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{t('deliveryTime')}</h3>
                    <p className="text-xs text-gray-400">{t('chooseDeliveryTime') || 'اختر وقت التوصيل المناسب'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block flex items-center gap-1.5">
                      <Calendar size={12} className="text-violet-500" />
                      {t('selectDate')}
                    </label>
                    <div className="relative">
                      <select
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">{t('asap')}</option>
                        {getAvailableDates().map(date => (
                          <option key={date.value} value={date.value}>{date.label}</option>
                        ))}
                      </select>
                      <ChevronLeft size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block flex items-center gap-1.5">
                      <Clock size={12} className="text-violet-500" />
                      {t('selectTime')}
                    </label>
                    <div className="relative">
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        disabled={!deliveryDate}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="">{deliveryDate ? t('selectTimeSlot') : t('selectDateFirst')}</option>
                        {deliveryDate && getAvailableTimes().map(time => (
                          <option key={time.value} value={time.value}>{time.label}</option>
                        ))}
                      </select>
                      <ChevronLeft size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Method Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-amber-50/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{t('paymentMethod')}</h3>
                    <p className="text-xs text-gray-400">{t('choosePaymentMethod') || 'اختر طريقة الدفع'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method, index) => (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={clsx(
                        'relative p-4 rounded-xl border-2 text-center transition-all duration-200 group',
                        selectedPaymentId === method.id
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-lg shadow-amber-500/10'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                      )}
                    >
                      <div className={clsx(
                        'mx-auto mb-2 transition-colors',
                        selectedPaymentId === method.id ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-500'
                      )}>
                        {method.icon}
                      </div>
                      <span className={clsx(
                        'text-xs font-semibold transition-colors',
                        selectedPaymentId === method.id ? 'text-amber-600' : 'text-gray-600'
                      )}>
                        {method.name}
                      </span>
                      {selectedPaymentId === method.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Saved Cards (Thawani) */}
            <AnimatePresence>
              {isThawaniPayment() && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-blue-50/80 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Wallet size={18} className="text-white" />
                      </div>
                      <h3 className="font-bold text-gray-800">{t('selectPaymentCard')}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    {loadingCards ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* New Card Option */}
                        <button
                          onClick={() => { setUseNewCard(true); setSelectedCardId(null); }}
                          className={clsx(
                            'w-full p-4 rounded-xl border-2 text-start transition-all',
                            useNewCard
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-100 hover:border-gray-200'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                useNewCard ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                              )}>
                                <Plus size={18} />
                              </div>
                              <span className={clsx('font-medium text-sm', useNewCard ? 'text-blue-600' : 'text-gray-700')}>
                                {t('useNewCard')}
                              </span>
                            </div>
                            {useNewCard && (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check size={10} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Saved Cards */}
                        {savedCards.map((card) => (
                          <button
                            key={card.id}
                            onClick={() => { setUseNewCard(false); setSelectedCardId(card.id); }}
                            className={clsx(
                              'w-full p-4 rounded-xl border-2 text-start transition-all',
                              !useNewCard && selectedCardId === card.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-100 hover:border-gray-200'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className={clsx(
                                  'font-medium text-sm',
                                  !useNewCard && selectedCardId === card.id ? 'text-blue-600' : 'text-gray-700'
                                )}>
                                  {getCardBrandIcon(card.brand)}
                                </span>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">•••• {card.last_four}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {card.is_default && <Badge variant="primary" size="sm">{tCommon('default')}</Badge>}
                                {!useNewCard && selectedCardId === card.id && (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}

                        {savedCards.length === 0 && (
                          <p className="text-center text-xs text-gray-400 py-4 bg-gray-50 rounded-xl">{t('noSavedCards')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order Notes Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-rose-50/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{t('orderNotes')}</h3>
                    <p className="text-xs text-gray-400">{t('addSpecialInstructions') || 'أضف أي ملاحظات خاصة'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder={t('orderNotesPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white resize-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all text-sm placeholder:text-gray-400"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Order Summary Sidebar - 2 columns */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-24"
            >
              {/* Summary Header */}
              <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="font-bold text-lg">{t('orderSummary')}</h2>
                </div>
                
                {cart.shop && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    {cart.shop.logo_img && (
                      <Image
                        src={cart.shop.logo_img}
                        alt={cart.shop.translation?.title || ''}
                        width={44}
                        height={44}
                        className="rounded-xl w-11 h-11 object-cover bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{cart.shop.translation?.title}</p>
                      <p className="text-xs text-white/60">{itemCount} {tCart('items')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Cart Items Preview */}
                <div className="space-y-2.5 mb-5 max-h-28 overflow-y-auto custom-scrollbar">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 bg-gray-100 rounded-lg text-xs font-bold flex items-center justify-center text-gray-600">
                          {item.quantity}×
                        </span>
                        <span className="text-gray-600 truncate max-w-[100px]">{t('item')} #{item.stock?.id}</span>
                      </div>
                      <span className="text-gray-800 font-semibold">
                        {(item.price * item.quantity).toFixed(2)} {tCommon('sar')}
                      </span>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-xs text-gray-400 text-center pt-1">+{cartItems.length - 3} {t('moreItems')}</p>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="py-4 border-y border-gray-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Ticket size={14} className="text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-700">{appliedCoupon}</span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon} 
                        className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {tCommon('delete')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Ticket size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder={tCart('couponCode')}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="w-full ps-9 pe-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        isLoading={couponLoading}
                        className="shrink-0 text-sm px-4"
                      >
                        {tCart('apply')}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="py-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tCart('subtotal')}</span>
                    <span className="text-gray-700 font-medium">{subtotal.toFixed(2)} {tCommon('sar')}</span>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tCart('deliveryFee')}</span>
                      <span className="text-gray-700 font-medium">
                        {calculateLoading ? (
                          <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                        ) : calculatedPrices?.delivery_fee ? (
                          `${calculatedPrices.delivery_fee.toFixed(2)} ${tCommon('sar')}`
                        ) : (
                          <span className="text-gray-400 text-xs">{t('calculated')}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {(calculatedPrices?.discount || calculatedPrices?.coupon_price) && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="flex items-center gap-1">
                        <Sparkles size={14} />
                        {tCart('discount')}
                      </span>
                      <span className="font-semibold">
                        -{((calculatedPrices.discount || 0) + (calculatedPrices.coupon_price || 0)).toFixed(2)} {tCommon('sar')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-4 px-4 -mx-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100">
                  <span className="font-bold text-gray-800">{tCart('total')}</span>
                  <div className="text-end">
                    <span className="text-2xl font-black text-[var(--primary)]">
                      {(calculatedPrices?.total_price || cart.total_price || subtotal).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-gray-500 ms-1">{tCommon('sar')}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="p-5 pt-0">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePlaceOrder}
                  disabled={
                    (deliveryType === 'delivery' && !selectedAddressId) ||
                    !selectedPaymentId ||
                    submitting
                  }
                  className={clsx(
                    'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl',
                    (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white hover:shadow-[var(--primary)]/30 hover:shadow-2xl'
                  )}
                >
                  {submitting ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      <span>{t('placeOrder')}</span>
                      {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                    </>
                  )}
                </motion.button>
                
                {/* Security Note */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield size={14} className="text-emerald-500" />
                  <span>{t('securePayment') || 'دفع آمن ومشفر 100%'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-gray-200 shadow-2xl shadow-black/10 safe-area-bottom">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{tCart('total')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[var(--primary)]">
                {(calculatedPrices?.total_price || cart.total_price || subtotal).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">{tCommon('sar')}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceOrder}
            disabled={
              (deliveryType === 'delivery' && !selectedAddressId) ||
              !selectedPaymentId ||
              submitting
            }
            className={clsx(
              'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all',
              (submitting || (deliveryType === 'delivery' && !selectedAddressId) || !selectedPaymentId)
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-xl shadow-[var(--primary)]/20'
            )}
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <ShoppingBag size={18} />
                <span>{t('placeOrder')}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-28 lg:hidden" />

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={handleCancelOtpVerification}
        title={t('otpVerification')}
      >
        <div className="space-y-6 p-2">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
              <CreditCard size={36} className="text-[var(--primary)]" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{t('enterOtpDescription')}</p>
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
              className="shadow-lg shadow-[var(--primary)]/30"
            >
              {t('verifyOtp')}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            {t('otpNotReceived')}{' '}
            <button className="text-[var(--primary)] font-semibold hover:underline">
              {t('resendOtp')}
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
