'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  Truck,
  Store,
  CreditCard,
  RefreshCw,
  Star,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { orderService } from '@/services';
import { Order, OrderStatus, OrderDetail } from '@/types';
import { useAuthStore, useSettingsStore } from '@/store';

// Order status steps
const ORDER_STEPS: OrderStatus[] = ['new', 'accepted', 'ready', 'on_a_way', 'delivered'];

const OrderDetailsPage = () => {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const tCheckout = useTranslations('checkout');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { locale } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const isRTL = locale === 'ar';

  const orderId = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/orders/' + orderId);
      return;
    }
    fetchOrderDetails();
  }, [isAuthenticated, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrderDetails(parseInt(orderId));
      setOrder(response.data);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.message || t('errorLoadingOrder'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(order.id);
      setShowCancelModal(false);
      fetchOrderDetails(); // Refresh order
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'فشل إلغاء الطلب');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRateOrder = async () => {
    if (!order || rating === 0) return;
    
    setRatingLoading(true);
    try {
      await orderService.reviewOrder(order.id, { rating, comment });
      setShowRatingModal(false);
      fetchOrderDetails();
    } catch (err: any) {
      console.error('Error rating order:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleReorder = async () => {
    // Navigate to shop page to reorder
    if (order?.shop?.uuid) {
      router.push(`/shops/${order.shop.uuid}`);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ready':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'on_a_way':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'canceled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return t('pending');
      case 'accepted':
        return t('accepted');
      case 'ready':
        return t('preparing');
      case 'on_a_way':
        return t('onTheWay');
      case 'delivered':
        return t('delivered');
      case 'canceled':
        return t('cancelled');
      default:
        return status;
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'canceled') return -1;
    return ORDER_STEPS.indexOf(order.status);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = order && ['new', 'accepted'].includes(order.status);
  const canRate = order && order.status === 'delivered';

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] flex items-center justify-center py-8 px-4">
        <Card className="text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--error)]/10 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-[var(--error)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--black)] mb-2">
            {error || 'لم يتم العثور على الطلب'}
          </h2>
          <p className="text-[var(--text-grey)] mb-6">
            تأكد من رقم الطلب وحاول مرة أخرى
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => router.push('/orders')}>
              {t('title')}
            </Button>
            <Button fullWidth onClick={fetchOrderDetails} leftIcon={<RefreshCw size={18} />}>
              {tCommon('retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)] py-8">
      <div className="container max-w-4xl">
        {/* Success Banner */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-[var(--radius-lg)] flex items-center gap-3"
            >
              <CheckCircle2 size={24} className="text-[var(--success)]" />
              <div>
                <p className="font-bold text-[var(--success)]">تم إنشاء طلبك بنجاح!</p>
                <p className="text-sm text-[var(--success)]/80">
                  سيتم تحضير طلبك قريباً وإرساله إليك
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/orders')}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-[var(--main-bg)] transition-colors"
            >
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--black)]">
                {t('orderNumber')} #{order.id}
              </h1>
              <p className="text-sm text-[var(--text-grey)]">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <Badge className={clsx('text-sm px-3 py-1.5', getStatusColor(order.status))}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        {/* Order Progress */}
        {order.status !== 'canceled' && (
          <Card className="mb-6">
            <h2 className="text-lg font-bold text-[var(--black)] mb-6">{t('orderStatus')}</h2>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-[var(--border)] rounded-full">
                <motion.div
                  className="h-full bg-[var(--primary)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.max(0, (getCurrentStepIndex() / (ORDER_STEPS.length - 1)) * 100)}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {ORDER_STEPS.map((step, index) => {
                  const isCompleted = index <= getCurrentStepIndex();
                  const isCurrent = index === getCurrentStepIndex();
                  
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <motion.div
                        className={clsx(
                          'w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors',
                          isCompleted
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white border-2 border-[var(--border)] text-[var(--text-grey)]'
                        )}
                        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                      >
                        {step === 'new' && <Clock size={20} />}
                        {step === 'accepted' && <CheckCircle2 size={20} />}
                        {step === 'ready' && <Package size={20} />}
                        {step === 'on_a_way' && <Truck size={20} />}
                        {step === 'delivered' && <CheckCircle2 size={20} />}
                      </motion.div>
                      <span className={clsx(
                        'text-xs mt-2 text-center',
                        isCompleted ? 'text-[var(--primary)] font-medium' : 'text-[var(--text-grey)]'
                      )}>
                        {getStatusText(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Cancelled Order */}
        {order.status === 'canceled' && (
          <Card className="mb-6 border-[var(--error)]/20 bg-[var(--error)]/5">
            <div className="flex items-center gap-3 text-[var(--error)]">
              <XCircle size={24} />
              <div>
                <p className="font-bold">تم إلغاء هذا الطلب</p>
                <p className="text-sm opacity-80">يمكنك إعادة الطلب من المتجر</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shop Info */}
            {order.shop && (
              <Card>
                <h2 className="text-lg font-bold text-[var(--black)] mb-4">المتجر</h2>
                <div className="flex items-center gap-4">
                  {order.shop.logo_img && (
                    <Image
                      src={order.shop.logo_img}
                      alt={order.shop.translation?.title || ''}
                      width={64}
                      height={64}
                      className="rounded-xl"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-[var(--black)]">
                      {order.shop.translation?.title}
                    </p>
                    {order.shop.phone && (
                      <a
                        href={`tel:${order.shop.phone}`}
                        className="flex items-center gap-1 text-sm text-[var(--primary)] mt-1"
                      >
                        <Phone size={14} />
                        {order.shop.phone}
                      </a>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/shops/${order.shop?.uuid}`)}
                  >
                    <Store size={16} />
                  </Button>
                </div>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">المنتجات</h2>
              <div className="space-y-4">
                {order.details?.map((item: OrderDetail) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-[var(--main-bg)] rounded-[var(--radius-md)]">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[var(--text-grey)]">
                      <Package size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--black)]">
                        منتج #{item.stock?.id || item.id}
                      </p>
                      <p className="text-sm text-[var(--text-grey)]">
                        الكمية: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-[var(--primary)]">
                      {tCommon('sar')} {item.total_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Delivery Info */}
            {order.location && (
              <Card>
                <h2 className="text-lg font-bold text-[var(--black)] mb-4">عنوان التوصيل</h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                    <MapPin size={20} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-[var(--black)]">{order.location.address}</p>
                    {order.delivery_date && (
                      <p className="text-sm text-[var(--text-grey)] mt-1">
                        <Calendar size={14} className="inline me-1" />
                        {order.delivery_date} {order.delivery_time && `- ${order.delivery_time}`}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Delivery Man */}
            {order.delivery_man && order.status === 'on_a_way' && (
              <Card>
                <h2 className="text-lg font-bold text-[var(--black)] mb-4">السائق</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[var(--main-bg)] rounded-full flex items-center justify-center">
                    {order.delivery_man.img ? (
                      <Image
                        src={order.delivery_man.img}
                        alt=""
                        width={56}
                        height={56}
                        className="rounded-full"
                      />
                    ) : (
                      <Truck size={24} className="text-[var(--text-grey)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--black)]">
                      {order.delivery_man.firstname} {order.delivery_man.lastname}
                    </p>
                    {order.delivery_man.rating_avg && (
                      <div className="flex items-center gap-1 text-sm text-[var(--text-grey)]">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        {order.delivery_man.rating_avg.toFixed(1)}
                      </div>
                    )}
                  </div>
                  {order.delivery_man.phone && (
                    <a href={`tel:${order.delivery_man.phone}`}>
                      <Button variant="outline" size="sm">
                        <Phone size={18} />
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <h2 className="text-lg font-bold text-[var(--black)] mb-4">ملخص الطلب</h2>

              <div className="space-y-3 pb-4 border-b border-[var(--border)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-grey)]">المجموع الفرعي</span>
                  <span className="text-[var(--black)]">
                    {tCommon('sar')} {(order.total_price - (order.delivery_fee || 0) - (order.tax || 0) - (order.service_fee || 0) + (order.discount || 0) + (order.coupon_price || 0)).toFixed(2)}
                  </span>
                </div>

                {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">رسوم التوصيل</span>
                    <span className="text-[var(--black)]">
                      {tCommon('sar')} {order.delivery_fee.toFixed(2)}
                    </span>
                  </div>
                )}

                {order.service_fee !== undefined && order.service_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">رسوم الخدمة</span>
                    <span className="text-[var(--black)]">
                      {tCommon('sar')} {order.service_fee.toFixed(2)}
                    </span>
                  </div>
                )}

                {order.tax !== undefined && order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-grey)]">الضريبة</span>
                    <span className="text-[var(--black)]">
                      {tCommon('sar')} {order.tax.toFixed(2)}
                    </span>
                  </div>
                )}

                {((order.discount || 0) + (order.coupon_price || 0)) > 0 && (
                  <div className="flex justify-between text-sm text-[var(--success)]">
                    <span>الخصم</span>
                    <span>
                      -{tCommon('sar')} {((order.discount || 0) + (order.coupon_price || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4">
                <span className="text-lg font-bold text-[var(--black)]">الإجمالي</span>
                <span className="text-lg font-bold text-[var(--primary)]">
                  {tCommon('sar')} {order.total_price.toFixed(2)}
                </span>
              </div>

              {/* Payment Info */}
              {order.transaction && (
                <div className="flex items-center gap-2 p-3 bg-[var(--main-bg)] rounded-[var(--radius-md)] mb-4">
                  <CreditCard size={18} className="text-[var(--text-grey)]" />
                  <span className="text-sm text-[var(--text-grey)]">
                    {order.transaction.payment_system?.tag === 'cash' ? 'الدفع عند الاستلام' : 'تم الدفع إلكترونياً'}
                  </span>
                  <Badge 
                    variant={order.transaction.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                    className="ms-auto"
                  >
                    {order.transaction.status === 'paid' ? 'مدفوع' : 'معلق'}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {canRate && (
                  <Button
                    fullWidth
                    onClick={() => setShowRatingModal(true)}
                    leftIcon={<Star size={18} />}
                  >
                    {t('rateOrder')}
                  </Button>
                )}

                {order.status === 'delivered' || order.status === 'canceled' ? (
                  <Button
                    fullWidth
                    variant={canRate ? 'outline' : 'primary'}
                    onClick={handleReorder}
                    leftIcon={<RefreshCw size={18} />}
                  >
                    {t('reorder')}
                  </Button>
                ) : null}

                {canCancel && (
                  <Button
                    fullWidth
                    variant="outline"
                    className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error)]/5"
                    onClick={() => setShowCancelModal(true)}
                  >
                    {t('cancelOrder')}
                  </Button>
                )}
              </div>

              {/* Order Note */}
              {order.note && (
                <div className="mt-4 p-3 bg-[var(--main-bg)] rounded-[var(--radius-md)]">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-grey)] mb-1">
                    <MessageSquare size={14} />
                    <span>ملاحظات</span>
                  </div>
                  <p className="text-sm text-[var(--black)]">{order.note}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('cancelOrder')}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--error)]/10 rounded-full flex items-center justify-center">
            <XCircle size={32} className="text-[var(--error)]" />
          </div>
          <p className="text-[var(--black)] mb-6">
            هل أنت متأكد من إلغاء هذا الطلب؟
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCancelModal(false)}
            >
              {tCommon('back')}
            </Button>
            <Button
              fullWidth
              className="bg-[var(--error)] hover:bg-[var(--error)]/90"
              onClick={handleCancelOrder}
              isLoading={cancelLoading}
            >
              {tCommon('confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={t('rateOrder')}
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-[var(--text-grey)] mb-4">كيف كانت تجربتك مع هذا الطلب؟</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={clsx(
                      'transition-colors',
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-[var(--border)]'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label="تعليق (اختياري)"
            placeholder="شاركنا رأيك..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowRatingModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleRateOrder}
              isLoading={ratingLoading}
              disabled={rating === 0}
            >
              إرسال التقييم
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetailsPage;
