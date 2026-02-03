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
  User,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Input, Badge, EmptyState, Modal } from '@/components/ui';
import { cartService, orderService, userService, settingsService } from '@/services';
import type { CartDetail, Address, CalculateResult, SavedCard, Currency } from '@/types';
import { useCartStore, useAuthStore, useSettingsStore, useLocationStore } from '@/store';

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
  const { locale, currency, currencies, setCurrency, setCurrencies } = useSettingsStore();
  const isRTL = locale === 'ar';

  const { user, isAuthenticated } = useAuthStore();
  const { cart, setCart, clearCart } = useCartStore();
  const { selectedAddress: globalSelectedAddress } = useLocationStore();

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

  // Recipient Info States (for ordering for someone else)
  const [orderForOther, setOrderForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');

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
      
      // Use the globally selected address from home page, or fall back to active/first address
      if (globalSelectedAddress?.id) {
        // Use the address selected on home page
        const matchingAddress = addressResponse.data?.find(a => a.id === globalSelectedAddress.id);
        if (matchingAddress) {
          setSelectedAddressId(matchingAddress.id);
        } else if (addressResponse.data?.length > 0) {
          // If selected address not found in list, use active or first
          const activeAddress = addressResponse.data?.find(a => a.active);
          setSelectedAddressId(activeAddress?.id || addressResponse.data[0].id);
        }
      } else {
        // No globally selected address, use active or first
        const activeAddress = addressResponse.data?.find(a => a.active);
        if (activeAddress) {
          setSelectedAddressId(activeAddress.id);
        } else if (addressResponse.data?.length > 0) {
          setSelectedAddressId(addressResponse.data[0].id);
        }
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
        type: deliveryType,
        coupon: appliedCoupon || undefined,
        address: formattedLocation,
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
    
    // Validate delivery address
    if (deliveryType === 'delivery' && !selectedAddressId) {
      setError(t('selectAddressError'));
      return;
    }
    
    // Validate payment method
    if (!selectedPaymentId) {
      setError(t('selectPaymentError'));
      return;
    }

    // Validate phone number
    if (!recipientPhone.trim()) {
      setError(t('phoneRequired'));
      return;
    }

    // Validate minimum order amount
    if (cart?.shop?.min_amount && subtotal < cart.shop.min_amount) {
      setError(`${t('minOrderRequired')} ${cart.shop.min_amount.toFixed(3)} ${tCommon('sar')}`);
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
        username?: string;
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
        phone: recipientPhone || user?.phone || undefined,
        username: orderForOther && recipientName ? recipientName : undefined,
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
      <div className="min-h-screen relative bg-gradient-to-b from-[#F4F5F8] via-[#e8f5f4] via-60% to-[#fff5f2]">
        {/* Loading Header */}
        <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] relative overflow-hidden min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
          </div>
          
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex-1 flex items-center" style={{ paddingTop: '90px' }}>
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-xl" />
              <div className="flex-1">
                <div className="h-8 sm:h-10 w-40 bg-white/10 rounded-lg mb-2" />
                <div className="h-5 w-56 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
          
          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
              <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#F4F4F4" />
            </svg>
          </div>
        </div>
        
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="h-6 w-36 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-24 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
      <div className="min-h-screen relative bg-gradient-to-b from-[#F4F5F8] via-[#e8f5f4] via-60% to-[#fff5f2] flex items-center justify-center py-16 px-4">
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
    <div className="min-h-screen relative bg-gradient-to-b from-[#F4F5F8] via-[#e8f5f4] via-60% to-[#fff5f2]">
      {/* Subtle decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] start-0 w-[400px] h-[400px] bg-[#80d1cd]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[50%] end-0 w-[500px] h-[500px] bg-[#FF3D00]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] start-[20%] w-[400px] h-[400px] bg-[#267881]/8 rounded-full blur-[100px]" />
      </div>
      {/* Header - Similar to Cart Page */}
      <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] relative overflow-hidden min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex-1 flex items-center" style={{ paddingTop: '90px' }}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
              >
                {isRTL ? (
                  <ChevronRight size={20} className="text-white group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronLeft size={20} className="text-white group-hover:-translate-x-0.5 transition-transform" />
                )}
              </button>
              
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {t('title')}
                </h1>
                <p className="text-white/60 text-sm sm:text-base lg:text-lg">
                  {itemCount} {tCart('items')}
                  {cart.shop && (
                    <span className="text-white/80">
                      {' '}{tCart('from')}{' '}
                      <span className="text-[var(--primary-light)] font-medium">{cart.shop.translation?.title}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Security Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-sm text-white/70">{t('secureCheckout')}</span>
            </div>
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
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 shadow-sm"
              style={{ padding: '16px 20px' }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0" style={{ padding: '10px' }}>
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-red-600 font-medium text-sm flex-1" style={{ padding: '0 8px' }}>{error}</p>
              <button 
                onClick={() => setError('')}
                className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                style={{ padding: '8px' }}
              >
                <X size={16} className="text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form Section - 3 columns - Unified Order Details Card */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3 order-1 lg:order-1"
          >
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-white via-white to-[var(--primary)]/[0.03] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100/80 bg-gradient-to-r from-[var(--primary)]/[0.08] via-[var(--primary)]/[0.03] to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">{t('orderDetails') || 'تفاصيل الطلب'}</h2>
                    <p className="text-xs text-gray-400">{t('fillOrderDetails') || 'أكمل بيانات طلبك'}</p>
                  </div>
                </div>
              </div>

              <div>
                {/* Section 1: Delivery Type */}
                <div style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                      <Truck size={14} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm">{t('deliveryType')}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Home Delivery */}
                    <button
                      onClick={() => setDeliveryType('delivery')}
                      className={clsx(
                        'relative rounded-2xl border-2 text-start transition-all duration-300 group overflow-hidden',
                        deliveryType === 'delivery'
                          ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/[0.12] via-[var(--primary)]/[0.06] to-cyan-50 shadow-lg shadow-[var(--primary)]/15'
                          : 'border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-teal-50/50 hover:border-cyan-200 hover:from-cyan-50 hover:to-teal-50/80'
                      )}
                      style={{ padding: '16px' }}
                    >
                      {/* Background decoration */}
                      <div className={clsx(
                        'absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all',
                        deliveryType === 'delivery' ? 'bg-[var(--primary)]/15' : 'bg-cyan-200/30'
                      )} />
                      
                      <div className="relative flex items-center gap-3">
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0',
                          deliveryType === 'delivery'
                            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                            : 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                        )}>
                          <Truck size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            'font-bold text-sm transition-colors',
                            deliveryType === 'delivery' ? 'text-[var(--primary)]' : 'text-cyan-700'
                          )}>
                            {t('homeDelivery')}
                          </p>
                          <p className={clsx(
                            'text-[11px] mt-0.5 transition-colors',
                            deliveryType === 'delivery' ? 'text-[var(--primary)]/70' : 'text-cyan-500'
                          )}>
                            {t('deliverToYou')}
                          </p>
                        </div>
                      </div>
                      
                      {deliveryType === 'delivery' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="absolute top-3 end-3 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30"
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>

                    {/* Store Pickup */}
                    <button
                      onClick={() => setDeliveryType('pickup')}
                      className={clsx(
                        'relative rounded-2xl border-2 text-start transition-all duration-300 group overflow-hidden',
                        deliveryType === 'pickup'
                          ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/[0.12] via-[var(--primary)]/[0.06] to-amber-50 shadow-lg shadow-[var(--primary)]/15'
                          : 'border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/50 hover:border-amber-200 hover:from-amber-50 hover:to-orange-50/80'
                      )}
                      style={{ padding: '16px' }}
                    >
                      {/* Background decoration */}
                      <div className={clsx(
                        'absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all',
                        deliveryType === 'pickup' ? 'bg-[var(--primary)]/15' : 'bg-amber-200/30'
                      )} />
                      
                      <div className="relative flex items-center gap-3">
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0',
                          deliveryType === 'pickup'
                            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30'
                            : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                        )}>
                          <Store size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            'font-bold text-sm transition-colors',
                            deliveryType === 'pickup' ? 'text-[var(--primary)]' : 'text-amber-700'
                          )}>
                            {t('pickup')}
                          </p>
                          <p className={clsx(
                            'text-[11px] mt-0.5 transition-colors',
                            deliveryType === 'pickup' ? 'text-[var(--primary)]/70' : 'text-amber-500'
                          )}>
                            {t('pickupFromStore')}
                          </p>
                        </div>
                      </div>
                      
                      {deliveryType === 'pickup' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="absolute top-3 end-3 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-md shadow-[var(--primary)]/30"
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section 2: Delivery Address - Only show for delivery */}
                <AnimatePresence>
                  {deliveryType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ padding: '20px' }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <MapPin size={14} className="text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-gray-700 text-sm">{t('deliveryAddress')}</h3>
                      </div>
                      {addresses.length === 0 ? (
                        <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border-2 border-dashed border-gray-200" style={{ padding: '24px 16px' }}>
                          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-200 flex items-center justify-center">
                            <MapPin size={20} className="text-gray-400" />
                          </div>
                          <p className="text-gray-500 mb-3 text-sm">{t('noAddresses')}</p>
                          <Button variant="outline" leftIcon={<Plus size={14} />} size="sm">
                            {t('addAddress')}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          {/* Show only the selected address */}
                          {(() => {
                            const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
                            return (
                              <div
                                className="rounded-xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/30"
                                style={{ padding: '12px 14px' }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500 text-white">
                                    <Home size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm text-emerald-600">
                                        {selectedAddress.title || t('address')}
                                      </span>
                                      {selectedAddress.active && (
                                        <Badge variant="primary" size="sm" className="!text-[10px] !py-0">{tCommon('default')}</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{formatAddress(selectedAddress)}</p>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section 3: Payment Method */}
                <div style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                      <CreditCard size={14} className="text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm">{t('paymentMethod')}</h3>
                  </div>
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => {
                      // Define colors and descriptions for each payment method
                      const getMethodConfig = (tag: string) => {
                        switch (tag) {
                          case 'cash':
                            return {
                              bg: 'from-emerald-50 via-green-50/70 to-teal-50/50',
                              bgSelected: 'from-[var(--primary)]/[0.12] via-[var(--primary)]/[0.06] to-emerald-50/50',
                              border: 'border-emerald-200/70',
                              borderHover: 'hover:border-emerald-300',
                              iconBg: 'from-emerald-500 to-teal-500',
                              iconShadow: 'shadow-emerald-500/25',
                              text: 'text-emerald-700',
                              textSub: 'text-emerald-500/80',
                              blur: 'bg-emerald-300/20',
                              description: t('cashDescription') || 'ادفع عند استلام طلبك',
                            };
                          case 'wallet':
                            return {
                              bg: 'from-blue-50 via-indigo-50/70 to-sky-50/50',
                              bgSelected: 'from-[var(--primary)]/[0.12] via-[var(--primary)]/[0.06] to-blue-50/50',
                              border: 'border-blue-200/70',
                              borderHover: 'hover:border-blue-300',
                              iconBg: 'from-blue-500 to-indigo-500',
                              iconShadow: 'shadow-blue-500/25',
                              text: 'text-blue-700',
                              textSub: 'text-blue-500/80',
                              blur: 'bg-blue-300/20',
                              description: t('walletDescription') || 'استخدم رصيد محفظتك',
                            };
                          case 'thawani':
                          default:
                            return {
                              bg: 'from-violet-50 via-purple-50/70 to-fuchsia-50/50',
                              bgSelected: 'from-[var(--primary)]/[0.12] via-[var(--primary)]/[0.06] to-violet-50/50',
                              border: 'border-violet-200/70',
                              borderHover: 'hover:border-violet-300',
                              iconBg: 'from-violet-500 to-purple-500',
                              iconShadow: 'shadow-violet-500/25',
                              text: 'text-violet-700',
                              textSub: 'text-violet-500/80',
                              blur: 'bg-violet-300/20',
                              description: t('cardDescription') || 'ادفع ببطاقتك الائتمانية',
                            };
                        }
                      };
                      const config = getMethodConfig(method.tag);
                      const isSelected = selectedPaymentId === method.id;
                      
                      return (
                        <motion.button
                          key={method.id}
                          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                          onClick={() => setSelectedPaymentId(method.id)}
                          className={clsx(
                            'relative w-full rounded-2xl border-2 text-start transition-all duration-300 group overflow-hidden',
                            isSelected
                              ? `border-[var(--primary)] bg-gradient-to-br ${config.bgSelected} shadow-lg shadow-[var(--primary)]/10`
                              : `${config.border} bg-gradient-to-br ${config.bg} ${config.borderHover} hover:shadow-md`
                          )}
                          style={{ padding: '14px 16px' }}
                        >
                          {/* Background decorations */}
                          <div className={clsx(
                            'absolute top-0 end-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all opacity-60',
                            isSelected ? 'bg-[var(--primary)]/20' : config.blur
                          )} />
                          <div className={clsx(
                            'absolute bottom-0 start-0 w-24 h-24 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 transition-all opacity-40',
                            isSelected ? 'bg-[var(--primary)]/15' : config.blur
                          )} />
                          
                          <div className="relative flex items-center gap-4">
                            {/* Icon */}
                            <div className={clsx(
                              'w-14 h-14 rounded-xl flex items-center justify-center transition-all shrink-0',
                              isSelected
                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-xl shadow-[var(--primary)]/30 scale-105'
                                : `bg-gradient-to-br ${config.iconBg} text-white shadow-lg ${config.iconShadow} group-hover:scale-105`
                            )}>
                              {method.icon}
                            </div>
                            
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'font-bold text-sm transition-colors',
                                isSelected ? 'text-[var(--primary)]' : config.text
                              )}>
                                {method.name}
                              </p>
                              <p className={clsx(
                                'text-[11px] mt-0.5 transition-colors',
                                isSelected ? 'text-[var(--primary)]/70' : config.textSub
                              )}>
                                {config.description}
                              </p>
                            </div>
                            
                            {/* Radio indicator */}
                            <div className={clsx(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                              isSelected
                                ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)]'
                                : 'border-gray-300 bg-white group-hover:border-gray-400'
                            )}>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                >
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                </div>

                {/* Section 5: Recipient Info */}
                <div style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Phone size={14} className="text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm">{t('recipientPhone')}</h3>
                  </div>
                  <div className="relative">
                    <Phone size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder={t('recipientPhonePlaceholder')}
                      className="w-full border border-gray-200 rounded-lg bg-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                      style={{ padding: '10px 14px', paddingInlineStart: '36px' }}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Section 6: Order Notes */}
                <div style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                      <FileText size={14} className="text-rose-600" />
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm">{t('orderNotes')}</h3>
                    <span className="text-xs text-gray-400">({tCommon('optional') || 'اختياري'})</span>
                  </div>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder={t('orderNotesPlaceholder')}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg bg-white resize-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all text-sm placeholder:text-gray-400"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Order Summary Sidebar - 2 columns */}
          <div className="lg:col-span-2 order-2 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden lg:sticky lg:top-24"
            >
              {/* Summary Header */}
              <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white" style={{ padding: '20px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center" style={{ padding: '10px' }}>
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="font-bold text-lg" style={{ padding: '0 4px' }}>{t('orderSummary')}</h2>
                </div>
                
                {cart.shop && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm" style={{ padding: '14px 16px' }}>
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

              <div style={{ padding: '20px' }}>
                {/* Cart Items Preview */}
                <div className="space-y-2.5 mb-5 max-h-40 overflow-y-auto custom-scrollbar">
                  {cartItems.slice(0, 3).map((item) => {
                    const productTitle = item.stock?.product?.translation?.title || `${t('item')} #${item.stock?.id}`;
                    const itemTotal = calculateItemTotal(item);
                    const hasAddons = item.addons && item.addons.length > 0;
                    
                    return (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-6 h-6 bg-[var(--primary)]/10 rounded-lg text-xs font-bold flex items-center justify-center text-[var(--primary)] shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="text-gray-700 truncate">{productTitle}</span>
                          </div>
                          <span className="text-gray-800 font-semibold shrink-0 ms-2">
                            {itemTotal.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                        {/* Addons */}
                        {hasAddons && (
                          <div className="ms-8 mt-1 flex flex-wrap gap-1">
                            {item.addons!.map((addon) => {
                              const addonTitle = addon.stock?.product?.translation?.title || `إضافة #${addon.id}`;
                              return (
                                <span
                                  key={addon.id}
                                  className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] rounded px-1.5 py-0.5"
                                >
                                  + {addonTitle}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {cartItems.length > 3 && (
                    <p className="text-xs text-gray-400 text-center" style={{ paddingTop: '4px' }}>+{cartItems.length - 3} {t('moreItems')}</p>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="border-y border-gray-100" style={{ padding: '16px 0' }}>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl border border-emerald-100" style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center" style={{ padding: '8px' }}>
                          <Ticket size={14} className="text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-700" style={{ padding: '0 4px' }}>{appliedCoupon}</span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon} 
                        className="text-xs text-red-500 hover:text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                        style={{ padding: '6px 10px' }}
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
                          className="w-full border border-gray-200 rounded-xl text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                          style={{ padding: '12px 14px', paddingInlineStart: '36px' }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        isLoading={couponLoading}
                        className="shrink-0 text-sm"
                        style={{ padding: '12px 18px' }}
                      >
                        {tCart('apply')}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1" style={{ padding: '4px 8px' }}>
                      <AlertCircle size={12} />
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Price Breakdown - تفصيل الأسعار بناءً على GetCalculateModel */}
                <div className="py-4 space-y-3 text-sm">
                  {/* Subtotal - السعر الأساسي للمنتجات (price) */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tCart('subtotal')}</span>
                    <span className="text-gray-700 font-medium">
                      {(calculatedPrices?.price ?? subtotal).toFixed(3)} {tCommon('sar')}
                    </span>
                  </div>

                  {/* Delivery Fee - سعر التوصيل (delivery_fee / deliveryFee) */}
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tCart('deliveryFee')}</span>
                      <span className="text-gray-700 font-medium">
                        {(() => {
                          const fee = calculatedPrices?.delivery_fee ?? calculatedPrices?.deliveryFee ?? cart?.shop?.price ?? 0;
                          return fee === 0 ? (
                            <span className="text-emerald-600">{tCart('freeDelivery') || 'مجاني'}</span>
                          ) : (
                            <>{fee.toFixed(3)} {tCommon('sar')}</>
                          );
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Service Fee - رسوم الخدمة (service_fee / serviceFee) */}
                  {(() => {
                    const serviceFee = calculatedPrices?.service_fee ?? calculatedPrices?.serviceFee;
                    if (serviceFee && serviceFee > 0) {
                      return (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('serviceFee') || tCart('serviceFee')}</span>
                          <span className="text-gray-700 font-medium">
                            {serviceFee.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Tax - الضريبة الإجمالية (total_tax / totalTax) */}
                  {(() => {
                    const tax = calculatedPrices?.total_tax ?? calculatedPrices?.totalTax ?? calculatedPrices?.tax;
                    if (tax && tax > 0) {
                      return (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('tax')}</span>
                          <span className="text-gray-700 font-medium">
                            {tax.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Shop Tax - ضريبة المتجر (total_shop_tax / totalShopTax) */}
                  {(() => {
                    const shopTax = calculatedPrices?.total_shop_tax ?? calculatedPrices?.totalShopTax;
                    if (shopTax && shopTax > 0) {
                      return (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{locale === 'ar' ? 'ضريبة المتجر' : 'Shop Tax'}</span>
                          <span className="text-gray-700 font-medium">
                            {shopTax.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Discount - إجمالي الخصومات (total_discount / totalDiscount / discount) */}
                  {(() => {
                    const discount = calculatedPrices?.total_discount ?? calculatedPrices?.totalDiscount ?? calculatedPrices?.discount;
                    if (discount && discount > 0) {
                      return (
                        <div className="flex justify-between text-emerald-600">
                          <span className="flex items-center gap-1">
                            <Sparkles size={14} />
                            {tCart('discount')}
                          </span>
                          <span className="font-semibold">
                            -{discount.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Coupon Discount - قيمة خصم الكوبون (coupon_price / couponPrice) */}
                  {(() => {
                    const couponDiscount = calculatedPrices?.coupon_price ?? calculatedPrices?.couponPrice;
                    if (couponDiscount && couponDiscount > 0) {
                      return (
                        <div className="flex justify-between text-emerald-600">
                          <span className="flex items-center gap-1">
                            <Ticket size={14} />
                            {tCart('couponApplied')}
                          </span>
                          <span className="font-semibold">
                            -{couponDiscount.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Bonus Shop - بونص المتجر (bonus_shop / bonusShop) */}
                  {(() => {
                    const bonus = calculatedPrices?.bonus_shop ?? calculatedPrices?.bonusShop;
                    if (bonus && typeof bonus === 'number' && bonus > 0) {
                      return (
                        <div className="flex justify-between text-blue-600">
                          <span className="flex items-center gap-1">
                            <Sparkles size={14} />
                            {locale === 'ar' ? 'بونص المتجر' : 'Shop Bonus'}
                          </span>
                          <span className="font-semibold">
                            -{bonus.toFixed(3)} {tCommon('sar')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Minimum Order Warning */}
                {cart?.shop?.min_amount && subtotal < cart.shop.min_amount && (
                  <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl" style={{ padding: '14px 16px' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0" style={{ padding: '8px' }}>
                        <AlertTriangle size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-700">{t('minOrderNotMet')}</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {t('minOrderRequired')} {cart.shop.min_amount.toFixed(3)} {tCommon('sar')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-4 px-4 -mx-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100">
                  <span className="font-bold text-gray-800">{tCart('total')}</span>
                  <div className="text-end">
                    {calculateLoading ? (
                      <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
                    ) : (
                      <>
                        <span className="text-2xl font-black text-[var(--primary)]">
                          {(calculatedPrices?.total_price ?? calculatedPrices?.totalPrice ?? (subtotal + (deliveryType === 'delivery' ? (cart?.shop?.price || 0) : 0))).toFixed(3)}
                        </span>
                        <span className="text-sm font-medium text-gray-500 ms-1">{tCommon('sar')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Place Order Button - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:block px-5 pb-5">
                {(() => {
                  const isDisabled = 
                    (deliveryType === 'delivery' && !selectedAddressId) ||
                    !selectedPaymentId ||
                    !recipientPhone.trim() ||
                    (cart?.shop?.min_amount && subtotal < cart.shop.min_amount) ||
                    submitting;
                  
                  return (
                    <motion.button
                      whileHover={!isDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      onClick={handlePlaceOrder}
                      disabled={isDisabled}
                      className="w-full rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 py-4"
                      style={{
                        backgroundColor: isDisabled ? '#E6E6E6' : '#FF3D00',
                        color: isDisabled ? '#898989' : '#ffffff',
                        border: isDisabled ? '1px solid #DCDCDC' : '1px solid #FF3D00',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: isDisabled ? 'none' : '0 10px 25px -5px rgba(255, 61, 0, 0.3)',
                      }}
                    >
                      {submitting ? (
                        <Loader2 size={22} className="animate-spin" style={{ color: isDisabled ? '#898989' : '#ffffff' }} />
                      ) : (
                        <>
                          <ShoppingBag size={20} style={{ color: isDisabled ? '#898989' : '#ffffff' }} />
                          <span style={{ color: isDisabled ? '#898989' : '#ffffff' }}>{t('placeOrder')}</span>
                          {isRTL ? (
                            <ArrowLeft size={18} style={{ color: isDisabled ? '#898989' : '#ffffff' }} />
                          ) : (
                            <ArrowRight size={18} style={{ color: isDisabled ? '#898989' : '#ffffff' }} />
                          )}
                        </>
                      )}
                    </motion.button>
                  );
                })()}
                
                {/* Security Note */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: '#898989' }}>
                  <Shield size={14} style={{ color: '#4CAF50' }} />
                  <span>{t('securePayment') || 'دفع آمن ومشفر 100%'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-gray-200 shadow-2xl shadow-black/10 safe-area-bottom">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500" style={{ padding: '0 4px' }}>{tCart('total')}</span>
            <div className="flex items-baseline gap-1">
              {calculateLoading ? (
                <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
              ) : (
                <>
                  <span className="text-xl font-black text-[var(--primary)]">
                    {(calculatedPrices?.total_price ?? calculatedPrices?.totalPrice ?? (subtotal + (deliveryType === 'delivery' ? (cart?.shop?.price || 0) : 0))).toFixed(3)}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{tCommon('sar')}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Minimum Order Warning - Mobile */}
          {cart?.shop?.min_amount && subtotal < cart.shop.min_amount && (
            <div className="mb-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2" style={{ padding: '10px 12px' }}>
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                {t('minOrderRequired')} {cart.shop.min_amount.toFixed(3)} {tCommon('sar')}
              </p>
            </div>
          )}
          
          {(() => {
            const isMobileDisabled = 
              (deliveryType === 'delivery' && !selectedAddressId) ||
              !selectedPaymentId ||
              !recipientPhone.trim() ||
              (cart?.shop?.min_amount && subtotal < cart.shop.min_amount) ||
              submitting;
            
            return (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                disabled={isMobileDisabled}
                className="w-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 py-5"
                style={{
                  backgroundColor: isMobileDisabled ? '#E6E6E6' : '#FF3D00',
                  color: isMobileDisabled ? '#898989' : '#ffffff',
                  border: isMobileDisabled ? '1px solid #DCDCDC' : '1px solid #FF3D00',
                  cursor: isMobileDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isMobileDisabled ? 'none' : '0 10px 25px -5px rgba(255, 61, 0, 0.3)',
                }}
              >
                {submitting ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: isMobileDisabled ? '#898989' : '#ffffff' }} />
                ) : (
                  <>
                    <ShoppingBag size={22} style={{ color: isMobileDisabled ? '#898989' : '#ffffff' }} />
                    <span style={{ color: isMobileDisabled ? '#898989' : '#ffffff' }}>{t('placeOrder')}</span>
                  </>
                )}
              </motion.button>
            );
          })()}
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
        <div className="space-y-6" style={{ padding: '8px' }}>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 rounded-2xl flex items-center justify-center" style={{ padding: '20px' }}>
              <CreditCard size={36} className="text-[var(--primary)]" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed" style={{ padding: '0 16px' }}>{t('enterOtpDescription')}</p>
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
              style={{ padding: '14px 20px' }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleVerifyOtp}
              isLoading={otpVerifying}
              disabled={!otpCode.trim() || otpCode.length < 4}
              className="shadow-lg shadow-[var(--primary)]/30"
              style={{ padding: '14px 20px' }}
            >
              {t('verifyOtp')}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500" style={{ padding: '8px 12px' }}>
            {t('otpNotReceived')}{' '}
            <button className="text-[var(--primary)] font-semibold hover:underline" style={{ padding: '0 4px' }}>
              {t('resendOtp')}
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
