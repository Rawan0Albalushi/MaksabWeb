'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  ShoppingBag,
  Truck,
  Store,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, EmptyState } from '@/components/ui';
import { orderService } from '@/services';
import { Order, OrderStatus } from '@/types';
import { useAuthStore, useSettingsStore } from '@/store';

type TabType = 'active' | 'completed' | 'cancelled';

// Helper function to extract delivery address from order
// API may return address in different fields: location, my_address, or address
const getDeliveryAddress = (order: Order): string | null => {
  // Check location field first
  if (order.location?.address) {
    return order.location.address;
  }
  
  // Check my_address field
  if (order.my_address) {
    if (typeof order.my_address.address === 'string') {
      return order.my_address.address;
    }
    if (typeof order.my_address.address === 'object' && order.my_address.address?.address) {
      return order.my_address.address.address;
    }
  }
  
  // Check address field
  if (order.address) {
    if (typeof order.address.address === 'string') {
      return order.address.address;
    }
    if (typeof order.address.address === 'object' && order.address.address?.address) {
      return order.address.address.address;
    }
  }
  
  return null;
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// Order Card Component
const OrderCard = ({
  order,
  onClick,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  formatDate,
  t,
  tCommon,
  isRTL,
}: {
  order: Order;
  onClick: () => void;
  getStatusColor: (status: OrderStatus) => string;
  getStatusText: (status: OrderStatus) => string;
  getStatusIcon: (status: OrderStatus) => React.ReactNode;
  formatDate: (date: string) => string;
  t: any;
  tCommon: any;
  isRTL: boolean;
}) => {
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={clsx(
          'relative bg-white rounded-2xl overflow-hidden',
          'border border-gray-100 hover:border-[var(--primary)]/20',
          'shadow-sm hover:shadow-xl',
          'transition-all duration-300'
        )}
        style={{ padding: '16px 18px' }}
      >
        {/* Status Indicator Line */}
        <div
          className={clsx(
            'absolute top-0 start-0 w-1 h-full rounded-e-full',
            order.status === 'new' || order.status === 'accepted' ? 'bg-blue-500' :
            order.status === 'ready' ? 'bg-orange-500' :
            order.status === 'on_a_way' ? 'bg-cyan-500' :
            order.status === 'delivered' ? 'bg-green-500' :
            order.status === 'canceled' ? 'bg-red-500' : 'bg-gray-300'
          )}
        />

        {/* Header: Order Number, Status, Price */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="text-lg font-bold text-gray-900">
                {t('orderNumber')} #{order.id}
              </span>
              <span 
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full text-xs font-bold shadow-md',
                  getStatusColor(order.status)
                )} 
                style={{ padding: '8px 14px' }}
              >
                {getStatusIcon(order.status)}
                {getStatusText(order.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>
          <div className="text-end shrink-0">
            <p className="text-xl font-bold text-[var(--primary)]">
              {order.total_price.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400">{tCommon('sar')}</p>
          </div>
        </div>

        {/* Shop Info */}
        {order.shop && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl mb-3" style={{ padding: '12px 14px' }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
              {order.shop.logo_img ? (
                <Image
                  src={order.shop.logo_img}
                  alt={order.shop.translation?.title || ''}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-orange-400">
                  <Store size={20} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {order.shop.translation?.title}
              </p>
              {order.details && (
                <p className="text-sm text-gray-500">
                  {order.details.length} {t('items')}
                </p>
              )}
            </div>
            {order.status === 'on_a_way' && (
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Truck size={18} className="text-cyan-600 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delivery Address */}
        {(() => {
          const deliveryAddress = getDeliveryAddress(order);
          return deliveryAddress ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3" style={{ padding: '4px 8px' }}>
              <MapPin size={14} className="text-[var(--primary)] shrink-0" />
              <span className="line-clamp-1">{deliveryAddress}</span>
            </div>
          ) : null;
        })()}

        {/* View Details */}
        <div className="flex items-center justify-end text-[var(--primary)] group-hover:translate-x-1 transition-transform" style={{ padding: '8px 4px' }}>
          <span className="text-sm font-semibold" style={{ padding: '0 4px' }}>{t('orderDetails')}</span>
          <ChevronIcon size={18} />
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton Loader
const OrdersSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
        <div className="flex justify-between mb-4">
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-7 w-20 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const OrdersPage = () => {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/orders');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, activeTab]);

  const fetchOrders = async () => {
    if (!loading) setRefreshing(true);
    
    try {
      let response;
      switch (activeTab) {
        case 'active':
          response = await orderService.getActiveOrders();
          break;
        case 'completed':
          response = await orderService.getCompletedOrders();
          break;
        case 'cancelled':
          response = await orderService.getCancelledOrders();
          break;
      }
      
      // Debug: Log order data to see actual API response structure
      console.log('📦 Orders API Response:', JSON.stringify(response, null, 2));
      if (response?.data?.[0]) {
        console.log('📦 First order structure:', {
          id: response.data[0].id,
          location: response.data[0].location,
          my_address: response.data[0].my_address,
          address: response.data[0].address,
        });
      }
      
      setOrders(response?.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500 text-white';
      case 'accepted':
        return 'bg-purple-500 text-white';
      case 'ready':
        return 'bg-amber-500 text-white';
      case 'on_a_way':
        return 'bg-cyan-500 text-white';
      case 'delivered':
        return 'bg-emerald-500 text-white';
      case 'canceled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'new':
      case 'accepted':
      case 'ready':
        return <Clock size={14} />;
      case 'on_a_way':
        return <Truck size={14} />;
      case 'delivered':
        return <CheckCircle2 size={14} />;
      case 'canceled':
        return <XCircle size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'active', label: t('active'), icon: <Clock size={18} /> },
    { key: 'completed', label: t('completed'), icon: <CheckCircle2 size={18} /> },
    { key: 'cancelled', label: t('cancelled'), icon: <XCircle size={18} /> },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-4xl mx-auto relative z-10" style={{ padding: '24px 18px 40px 18px', paddingTop: '90px' }}>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl group border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              {isRTL ? (
                <ChevronRight size={22} className="text-white group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronLeft size={22} className="text-white group-hover:scale-110 transition-transform" />
              )}
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchOrders}
              disabled={refreshing}
              className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
              style={{ padding: '10px 16px' }}
            >
              <RefreshCw size={18} className={clsx('me-2', refreshing && 'animate-spin')} />
              {tCommon('retry')}
            </Button>
          </div>

          {/* Title & Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-orange-400 flex items-center justify-center shadow-lg">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {t('title')}
                </h1>
                <p className="text-white/60 text-sm sm:text-base">
                  {t('subtitle') || 'تتبع جميع طلباتك'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#F4F4F4" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto" style={{ padding: '24px 18px' }}>
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md border border-gray-200 flex gap-1.5"
          style={{ padding: '8px', marginBottom: '20px' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base',
                activeTab === tab.key
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              )}
              style={activeTab === tab.key ? {
                padding: '12px 14px',
                background: 'linear-gradient(135deg, #FF3D00 0%, #FFA000 100%)',
                boxShadow: '0 4px 15px rgba(255, 61, 0, 0.4)'
              } : {
                padding: '12px 14px'
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-lg shadow-orange-100 mb-8"
            >
              <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-orange-400" />
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              {t('noOrders')}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xs mb-8">
              {activeTab === 'active'
                ? 'ليس لديك طلبات نشطة حالياً'
                : activeTab === 'completed'
                ? 'لم تكتمل أي طلبات بعد'
                : 'لا توجد طلبات ملغاة'}
            </p>

            <Link href="/shops">
              <Button
                size="lg"
                className="text-base font-semibold rounded-xl shadow-lg shadow-orange-200 !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)]"
                style={{ padding: '16px 32px' }}
              >
                <Store className="w-5 h-5 me-2" />
                {tCommon('startShopping')}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getStatusIcon={getStatusIcon}
                  formatDate={formatDate}
                  t={t}
                  tCommon={tCommon}
                  isRTL={isRTL}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Continue Shopping - Bottom */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Link href="/shops">
              <Button variant="ghost" className="text-gray-500 hover:text-[var(--primary)]" style={{ padding: '12px 24px' }}>
                <Store className="w-5 h-5 me-2" />
                تصفح المتاجر
                <ArrowIcon className="w-4 h-4 ms-2" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
