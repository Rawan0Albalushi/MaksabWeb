'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { orderService } from '@/services';
import { Order, OrderStatus } from '@/types';
import { useAuthStore, useSettingsStore } from '@/store';

type TabType = 'active' | 'completed' | 'cancelled';

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
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-purple-100 text-purple-700';
      case 'ready':
        return 'bg-orange-100 text-orange-700';
      case 'on_a_way':
        return 'bg-cyan-100 text-cyan-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'canceled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        return <Clock size={16} />;
      case 'on_a_way':
        return <Package size={16} />;
      case 'delivered':
        return <CheckCircle2 size={16} />;
      case 'canceled':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
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

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'active', label: t('active'), icon: <Clock size={18} /> },
    { key: 'completed', label: t('completed'), icon: <CheckCircle2 size={18} /> },
    { key: 'cancelled', label: t('cancelled'), icon: <XCircle size={18} /> },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--main-bg)] py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-[var(--main-bg)] transition-colors"
            >
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <h1 className="text-2xl font-bold text-[var(--black)]">{t('title')}</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            disabled={refreshing}
            leftIcon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
          >
            {tCommon('retry')}
          </Button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-[var(--radius-lg)] p-2 mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-md)] font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-grey)] hover:bg-[var(--main-bg)]'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            type="orders"
            title={t('noOrders')}
            description={
              activeTab === 'active'
                ? 'ليس لديك طلبات نشطة حالياً'
                : activeTab === 'completed'
                ? 'لم تكتمل أي طلبات بعد'
                : 'لا توجد طلبات ملغاة'
            }
            action={{
              label: tCommon('startShopping'),
              onClick: () => router.push('/shops'),
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-[var(--black)]">
                            {t('orderNumber')} #{order.id}
                          </span>
                          <Badge className={getStatusColor(order.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {getStatusText(order.status)}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-grey)]">
                          <Calendar size={14} />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-lg font-bold text-[var(--primary)]">
                          {tCommon('sar')} {order.total_price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Shop Info */}
                    {order.shop && (
                      <div className="flex items-center gap-3 p-3 bg-[var(--main-bg)] rounded-[var(--radius-md)] mb-4">
                        {order.shop.logo_img && (
                          <img
                            src={order.shop.logo_img}
                            alt={order.shop.translation?.title || ''}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-[var(--black)]">
                            {order.shop.translation?.title}
                          </p>
                          {order.details && (
                            <p className="text-sm text-[var(--text-grey)]">
                              {order.details.length} {t('items')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {order.location && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-grey)]">
                        <MapPin size={14} />
                        <span className="line-clamp-1">{order.location.address}</span>
                      </div>
                    )}

                    {/* View Details Arrow */}
                    <div className="flex items-center justify-end mt-4 text-[var(--primary)]">
                      <span className="text-sm font-medium">{t('orderDetails')}</span>
                      {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
