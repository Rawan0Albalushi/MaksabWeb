'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Home,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { Button, Card } from '@/components/ui';
import { orderService } from '@/services';
import { useCartStore, useSettingsStore } from '@/store';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending' | 'cancelled';

const PaymentResultPage = () => {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useSettingsStore();
  const { clearCart } = useCartStore();
  const isRTL = locale === 'ar';

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    processPaymentResult();
  }, []);

  // Auto-redirect to order page on success after a countdown
  useEffect(() => {
    if (status === 'success' && orderId) {
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push(`/${locale}/orders/${orderId}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [status, orderId, router, locale]);

  const processPaymentResult = async () => {
    try {
      // Get parameters from URL - support multiple parameter names
      const orderIdParam = searchParams.get('order_id') || searchParams.get('o_id');
      const sessionId = searchParams.get('session_id');
      const paymentIntentId = searchParams.get('payment_intent_id');
      const statusParam = searchParams.get('status');

      // Check for pending order from localStorage (for when user returns from Thawani)
      const pendingOrderId = localStorage.getItem('pending_order_id');
      const pendingOrderTime = localStorage.getItem('pending_order_time');
      
      // Use pending order if no URL params and order is recent (within 1 hour)
      let effectiveOrderId = orderIdParam;
      if (!orderIdParam && pendingOrderId && pendingOrderTime) {
        const timeDiff = Date.now() - parseInt(pendingOrderTime);
        if (timeDiff < 3600000) { // 1 hour
          effectiveOrderId = pendingOrderId;
        }
        // Clear pending order from localStorage
        localStorage.removeItem('pending_order_id');
        localStorage.removeItem('pending_order_time');
      }

      // Set order ID if available
      if (effectiveOrderId) {
        setOrderId(parseInt(effectiveOrderId));
      }

      // Handle direct status from URL (from API redirect)
      if (statusParam) {
        switch (statusParam) {
          case 'success':
          case 'paid':
            setStatus('success');
            setMessage(t('paymentSuccess'));
            clearCart();
            return;
          case 'failed':
          case 'error':
            setStatus('failed');
            setMessage(t('paymentFailed'));
            return;
          case 'cancelled':
          case 'canceled':
            setStatus('cancelled');
            setMessage(t('paymentCancelled'));
            return;
          case 'pending':
            setStatus('pending');
            setMessage(t('paymentPending'));
            return;
        }
      }

      // If we have an order ID (from URL or localStorage), check its status
      if (effectiveOrderId) {
        try {
          // First try to get order details to check payment status
          const orderResponse = await orderService.getOrderDetails(parseInt(effectiveOrderId));
          const order = orderResponse.data;
          
          if (order.transaction?.status === 'paid') {
            setStatus('success');
            setMessage(t('paymentSuccess'));
            clearCart();
            return;
          } else if (order.transaction?.status === 'canceled' || order.transaction?.status === 'rejected') {
            setStatus('failed');
            setMessage(t('paymentFailed'));
            return;
          } else if (order.status === 'canceled') {
            setStatus('cancelled');
            setMessage(t('paymentCancelled'));
            return;
          } else {
            // Payment still pending or processing
            setStatus('pending');
            setMessage(t('paymentPending'));
            return;
          }
        } catch (orderError) {
          console.log('Could not fetch order details, trying Thawani process API');
        }
      }

      // Fallback: If we have session_id or payment_intent_id, call API to verify
      if (sessionId || paymentIntentId || effectiveOrderId) {
        const response = await orderService.processThawaniResult({
          order_id: effectiveOrderId ? parseInt(effectiveOrderId) : undefined,
          session_id: sessionId || undefined,
          payment_intent_id: paymentIntentId || undefined,
        });

        const result = response.data;
        setOrderId(result.order_id);
        setTransactionId(result.transaction_id || null);

        switch (result.status) {
          case 'success':
            setStatus('success');
            setMessage(result.message || t('paymentSuccess'));
            clearCart();
            break;
          case 'failed':
            setStatus('failed');
            setMessage(result.message || t('paymentFailed'));
            break;
          case 'pending':
            setStatus('pending');
            setMessage(result.message || t('paymentPending'));
            break;
          case 'cancelled':
            setStatus('cancelled');
            setMessage(result.message || t('paymentCancelled'));
            break;
          default:
            setStatus('failed');
            setMessage(t('unknownError'));
        }
      } else {
        // No parameters - show error
        setStatus('failed');
        setMessage(t('processingError'));
      }
    } catch (error: any) {
      console.error('Error processing payment result:', error);
      setStatus('failed');
      setMessage(error.response?.data?.message || t('processingError'));
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 size={64} className="animate-spin text-[var(--primary)]" />;
      case 'success':
        return <CheckCircle2 size={64} className="text-[var(--success)]" />;
      case 'failed':
        return <XCircle size={64} className="text-[var(--error)]" />;
      case 'pending':
        return <AlertCircle size={64} className="text-[var(--warning)]" />;
      case 'cancelled':
        return <XCircle size={64} className="text-[var(--text-grey)]" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return t('processingPayment');
      case 'success':
        return t('paymentSuccessTitle');
      case 'failed':
        return t('paymentFailedTitle');
      case 'pending':
        return t('paymentPendingTitle');
      case 'cancelled':
        return t('paymentCancelledTitle');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-[var(--success)]/10';
      case 'failed':
        return 'bg-[var(--error)]/10';
      case 'pending':
        return 'bg-[var(--warning)]/10';
      case 'cancelled':
        return 'bg-[var(--border)]';
      default:
        return 'bg-[var(--primary)]/10';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center ${getStatusColor()}`}
          >
            {getStatusIcon()}
          </motion.div>

          {/* Status Title */}
          <h1 className="text-2xl font-bold text-[var(--black)] mb-3">
            {getStatusTitle()}
          </h1>

          {/* Status Message */}
          <p className="text-[var(--text-grey)] mb-3">{message}</p>
          
          {/* Auto-redirect countdown for success */}
          {status === 'success' && orderId && (
            <p className="text-sm text-[var(--primary)] mb-6 animate-pulse">
              {t('redirectingToOrder', { seconds: redirectCountdown })}
            </p>
          )}
          
          {status !== 'success' && <div className="mb-6" />}

          {/* Order & Transaction Info */}
          {(orderId || transactionId) && status !== 'loading' && (
            <div className="bg-[var(--main-bg)] rounded-[var(--radius-md)] p-4 mb-6 space-y-2">
              {orderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">{t('orderNumber')}</span>
                  <span className="font-medium text-[var(--black)]">#{orderId}</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">{t('transactionId')}</span>
                  <span className="font-medium text-[var(--black)] font-mono text-xs">
                    {transactionId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {status !== 'loading' && (
            <div className="space-y-3">
              {status === 'success' && orderId && (
                <Button
                  fullWidth
                  onClick={() => router.push(`/orders/${orderId}`)}
                  leftIcon={<ShoppingBag size={20} />}
                >
                  {t('viewOrder')}
                </Button>
              )}

              {(status === 'failed' || status === 'cancelled') && (
                <Button
                  fullWidth
                  onClick={() => router.push('/checkout')}
                  leftIcon={<RefreshCw size={20} />}
                >
                  {t('tryAgain')}
                </Button>
              )}

              {status === 'pending' && orderId && (
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => router.push(`/orders/${orderId}`)}
                  leftIcon={<ShoppingBag size={20} />}
                >
                  {t('viewOrder')}
                </Button>
              )}

              <Button
                fullWidth
                variant={status === 'success' ? 'outline' : 'ghost'}
                onClick={() => router.push('/')}
                leftIcon={<Home size={20} />}
              >
                {t('backToHome')}
              </Button>
            </div>
          )}
        </Card>

        {/* Help Text */}
        {status === 'failed' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-[var(--text-grey)] mt-6"
          >
            {t('needHelp')}{' '}
            <button className="text-[var(--primary)] font-medium hover:underline">
              {t('contactSupport')}
            </button>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentResultPage;
