'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
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
  Sparkles,
  Gift,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Timer,
  Route,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button, Badge, Modal, Input } from '@/components/ui';
import { orderService } from '@/services';
import { Order, OrderStatus, OrderDetail } from '@/types';
import { useAuthStore, useSettingsStore } from '@/store';
import { MapConfig, getRoute, formatDistance, formatDuration } from '@/utils/mapConfig';

// Order status steps with percentages matching mobile app
const ORDER_STEPS: { status: OrderStatus; percentage: number }[] = [
  { status: 'new', percentage: 20 },
  { status: 'accepted', percentage: 40 },
  { status: 'ready', percentage: 60 },
  { status: 'on_a_way', percentage: 80 },
  { status: 'delivered', percentage: 100 },
];

// Helper function to get progress percentage
const getProgressPercentage = (status: OrderStatus): number => {
  if (status === 'canceled') return 0;
  const step = ORDER_STEPS.find(s => s.status === status);
  return step?.percentage || 0;
};

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

// Helper function to get delivery location coordinates
const getDeliveryLocation = (order: Order): { lat: number; lng: number } | null => {
  // Check location field first
  if (order.location?.latitude && order.location?.longitude) {
    return { lat: order.location.latitude, lng: order.location.longitude };
  }
  
  // Check my_address.location field
  if (order.my_address?.location) {
    if (Array.isArray(order.my_address.location)) {
      return { lat: order.my_address.location[0], lng: order.my_address.location[1] };
    }
    if (typeof order.my_address.location === 'object' && 'latitude' in order.my_address.location) {
      return { lat: order.my_address.location.latitude, lng: order.my_address.location.longitude };
    }
  }
  
  // Check address.location field
  if (order.address?.location) {
    if (Array.isArray(order.address.location)) {
      return { lat: order.address.location[0], lng: order.address.location[1] };
    }
    if (typeof order.address.location === 'object' && 'latitude' in order.address.location) {
      return { lat: order.address.location.latitude, lng: order.address.location.longitude };
    }
  }
  
  return null;
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Skeleton Loader
const OrderDetailsSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="h-8 w-24 bg-white/10 rounded-full" />
          </div>
          <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-12" />
    </div>

    {/* Content Skeleton */}
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="animate-pulse grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 h-40" />
          <div className="bg-white rounded-2xl p-5 h-[300px]" />
          <div className="bg-white rounded-2xl p-5 h-60" />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 h-80" />
        </div>
      </div>
    </div>
  </div>
);

// Helper function to validate coordinates
const isValidCoordinate = (coord: { lat: number; lng: number } | null): coord is { lat: number; lng: number } => {
  return coord !== null && 
    typeof coord.lat === 'number' && 
    typeof coord.lng === 'number' && 
    isFinite(coord.lat) && 
    isFinite(coord.lng) &&
    coord.lat !== 0 && 
    coord.lng !== 0;
};

// Order Tracking Map Component
interface OrderTrackingMapProps {
  shopLocation: { lat: number; lng: number } | null;
  deliveryLocation: { lat: number; lng: number } | null;
  driverLocation: { lat: number; lng: number } | null;
  status: OrderStatus;
  isRTL: boolean;
}

const OrderTrackingMap = ({ shopLocation, deliveryLocation, driverLocation, status, isRTL }: OrderTrackingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const shopMarkerRef = useRef<google.maps.Marker | null>(null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsLoaded(true);
        setIsLoading(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MapConfig.googleApiKey}&libraries=places&language=${isRTL ? 'ar' : 'en'}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, [isRTL]);

  // Initialize map and markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    // Validate coordinates
    const validShopLocation = isValidCoordinate(shopLocation) ? shopLocation : null;
    const validDeliveryLocation = isValidCoordinate(deliveryLocation) ? deliveryLocation : null;
    const validDriverLocation = isValidCoordinate(driverLocation) ? driverLocation : null;

    // Calculate center based on available locations
    let centerLat = MapConfig.defaultLocation.latitude;
    let centerLng = MapConfig.defaultLocation.longitude;

    if (validDriverLocation && status === 'on_a_way') {
      centerLat = validDriverLocation.lat;
      centerLng = validDriverLocation.lng;
    } else if (validShopLocation) {
      centerLat = validShopLocation.lat;
      centerLng = validShopLocation.lng;
    } else if (validDeliveryLocation) {
      centerLat = validDeliveryLocation.lat;
      centerLng = validDeliveryLocation.lng;
    }

    // Create map if not exists
    if (!mapInstanceRef.current) {
      const mapOptions: google.maps.MapOptions = {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    }

    const map = mapInstanceRef.current;

    // Create shop marker
    if (validShopLocation && !shopMarkerRef.current) {
      shopMarkerRef.current = new window.google.maps.Marker({
        position: { lat: validShopLocation.lat, lng: validShopLocation.lng },
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="3"/>
              <path d="M14 18h12M14 22h12M12 14h16l-2 12H14L12 14z" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        },
        title: isRTL ? 'موقع المتجر' : 'Shop Location',
      });
    }

    // Create delivery marker
    if (validDeliveryLocation && !deliveryMarkerRef.current) {
      deliveryMarkerRef.current = new window.google.maps.Marker({
        position: { lat: validDeliveryLocation.lat, lng: validDeliveryLocation.lng },
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#FF3D00" stroke="white" stroke-width="3"/>
              <path d="M20 12v8m0 0l-4-4m4 4l4-4M20 28a2 2 0 100-4 2 2 0 000 4z" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        },
        title: isRTL ? 'موقع التوصيل' : 'Delivery Location',
      });
    }

    // Fit bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    if (validShopLocation) bounds.extend({ lat: validShopLocation.lat, lng: validShopLocation.lng });
    if (validDeliveryLocation) bounds.extend({ lat: validDeliveryLocation.lat, lng: validDeliveryLocation.lng });
    if (validDriverLocation && status === 'on_a_way') bounds.extend({ lat: validDriverLocation.lat, lng: validDriverLocation.lng });
    
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }

  }, [isLoaded, shopLocation, deliveryLocation, status, isRTL]);

  // Update driver marker position
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;
    const validDriverLocation = isValidCoordinate(driverLocation) ? driverLocation : null;

    if (validDriverLocation && status === 'on_a_way') {
      if (!driverMarkerRef.current) {
        // Create driver marker
        driverMarkerRef.current = new window.google.maps.Marker({
          position: { lat: validDriverLocation.lat, lng: validDriverLocation.lng },
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="#0891B2" stroke="white" stroke-width="3"/>
                <path d="M16 28h16M18 22h12l2 6H16l2-6zM22 28v4M26 28v4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="18" r="3" stroke="white" stroke-width="2" fill="none"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 24),
          },
          title: isRTL ? 'موقع السائق' : 'Driver Location',
          zIndex: 999,
        });
      } else {
        // Update driver marker position with animation
        driverMarkerRef.current.setPosition({ lat: validDriverLocation.lat, lng: validDriverLocation.lng });
      }

      // Center map on driver
      map.panTo({ lat: validDriverLocation.lat, lng: validDriverLocation.lng });
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
      driverMarkerRef.current = null;
    }
  }, [isLoaded, driverLocation, status, isRTL]);

  // Draw route between points
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;

    // Validate coordinates
    const validShopLocation = isValidCoordinate(shopLocation) ? shopLocation : null;
    const validDeliveryLocation = isValidCoordinate(deliveryLocation) ? deliveryLocation : null;
    const validDriverLocation = isValidCoordinate(driverLocation) ? driverLocation : null;

    // Determine start and end points for route
    let startPoint: { lat: number; lng: number } | null = null;
    let endPoint: { lat: number; lng: number } | null = null;

    if (status === 'on_a_way' && validDriverLocation && validDeliveryLocation) {
      // When driver is on the way, show route from driver to delivery
      startPoint = validDriverLocation;
      endPoint = validDeliveryLocation;
    } else if (validShopLocation && validDeliveryLocation) {
      // Otherwise show route from shop to delivery
      startPoint = validShopLocation;
      endPoint = validDeliveryLocation;
    }

    if (startPoint && endPoint) {
      // Fetch route and draw polyline
      getRoute(startPoint, endPoint).then(route => {
        if (route) {
          setRouteInfo({ distance: route.distance, duration: route.duration });

          // Remove existing polyline
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
          }

          // Create new polyline
          const path = route.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0],
          }));

          routePolylineRef.current = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: status === 'on_a_way' ? '#0891B2' : '#FF3D00',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map,
          });
        }
      });
    }

    return () => {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    };
  }, [isLoaded, shopLocation, deliveryLocation, driverLocation, status]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-xl flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-3">
          <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
        </div>
        <p className="text-sm text-gray-500">{isRTL ? 'جاري تحميل الخريطة...' : 'Loading map...'}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-xl flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <MapPin size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-red-500">{isRTL ? 'فشل تحميل الخريطة' : 'Failed to load map'}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-[300px] rounded-xl z-0"
      />
      
      {/* Route Info Overlay */}
      {routeInfo && (
        <div className="absolute top-3 start-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <Timer size={16} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{isRTL ? 'الوقت المتبقي' : 'ETA'}</p>
                <p className="font-bold text-gray-900">{formatDuration(routeInfo.duration)}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <Route size={16} className="text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{isRTL ? 'المسافة' : 'Distance'}</p>
                <p className="font-bold text-gray-900">{formatDistance(routeInfo.distance)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 start-3 end-3 flex items-center justify-center gap-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600">{isRTL ? 'المتجر' : 'Shop'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
          <span className="text-xs text-gray-600">{isRTL ? 'التوصيل' : 'Delivery'}</span>
        </div>
        {status === 'on_a_way' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-gray-600">{isRTL ? 'السائق' : 'Driver'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Fetch driver location periodically when order is on the way
  const fetchDriverLocation = useCallback(async () => {
    if (!order?.delivery_man?.id || order.status !== 'on_a_way') return;

    try {
      const response = await orderService.getDeliveryManLocation(order.delivery_man.id);
      if (response.data?.latitude && response.data?.longitude) {
        setDriverLocation({
          lat: response.data.latitude,
          lng: response.data.longitude,
        });
      }
    } catch (err) {
      console.error('Error fetching driver location:', err);
    }
  }, [order?.delivery_man?.id, order?.status]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/orders/' + orderId);
      return;
    }
    fetchOrderDetails();
  }, [isAuthenticated, orderId]);

  // Poll driver location every 10 seconds when on_a_way
  useEffect(() => {
    if (order?.status !== 'on_a_way' || !order?.delivery_man?.id) return;

    // Fetch immediately
    fetchDriverLocation();

    // Then poll every 10 seconds
    const interval = setInterval(fetchDriverLocation, 10000);

    return () => clearInterval(interval);
  }, [order?.status, order?.delivery_man?.id, fetchDriverLocation]);

  // Refresh order details periodically for active orders
  useEffect(() => {
    if (!order || ['delivered', 'canceled'].includes(order.status)) return;

    const interval = setInterval(fetchOrderDetails, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [order?.status]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrderDetails(parseInt(orderId));
      
      // Debug: Log order data to see actual API response structure
      console.log('📦 Order Details API Response:', JSON.stringify(response, null, 2));
      console.log('📦 Order fields:', {
        id: response.data?.id,
        status: response.data?.status,
        location: response.data?.location,
        my_address: response.data?.my_address,
        address: response.data?.address,
        // Check different possible delivery man field names
        delivery_man: response.data?.delivery_man,
        deliveryman: (response.data as any)?.deliveryman,
        driver: (response.data as any)?.driver,
      });
      
      // Normalize delivery_man field (API may use different names)
      const orderData = response.data;
      if (!orderData.delivery_man) {
        // Check alternative field names
        const altDeliveryMan = (orderData as any)?.deliveryman || (orderData as any)?.driver;
        if (altDeliveryMan) {
          orderData.delivery_man = altDeliveryMan;
        }
      }
      
      setOrder(orderData);
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
      fetchOrderDetails();
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
    if (order?.shop?.uuid) {
      router.push(`/shops/${order.shop.uuid}`);
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

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'canceled') return -1;
    return ORDER_STEPS.findIndex(s => s.status === order.status);
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

  // Get locations for map
  const shopLocation = order?.shop?.location?.latitude && order?.shop?.location?.longitude ? {
    lat: order.shop.location.latitude,
    lng: order.shop.location.longitude,
  } : null;
  const deliveryLocation = order ? getDeliveryLocation(order) : null;
  
  // Validate locations before rendering map
  const hasValidMapLocations = isValidCoordinate(shopLocation) || isValidCoordinate(deliveryLocation);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl text-center max-w-md w-full"
          style={{ padding: '40px 32px' }}
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {error || 'لم يتم العثور على الطلب'}
          </h2>
          <p className="text-gray-500 mb-8">
            تأكد من رقم الطلب وحاول مرة أخرى
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.push('/orders')}
              className="rounded-xl"
              style={{ padding: '14px 20px' }}
            >
              {t('title')}
            </Button>
            <Button
              fullWidth
              onClick={fetchOrderDetails}
              className="rounded-xl !bg-[var(--primary)]"
              style={{ padding: '14px 20px' }}
            >
              <RefreshCw size={18} className="me-2" />
              {tCommon('retry')}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Success Banner - Inside Header */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-500/20 backdrop-blur-sm border-b border-green-400/30"
              style={{ padding: '16px 0' }}
            >
              <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-green-300">تم إنشاء طلبك بنجاح!</p>
                  <p className="text-sm text-green-300/70">سيتم تحضير طلبك قريباً وإرساله إليك</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/orders')}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl group border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              {isRTL ? (
                <ChevronRight size={22} className="text-white group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronLeft size={22} className="text-white group-hover:scale-110 transition-transform" />
              )}
            </button>

            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full text-sm font-bold shadow-lg',
                getStatusColor(order.status)
              )}
              style={{ padding: '10px 18px' }}
            >
              {order.status === 'on_a_way' ? <Truck size={14} /> :
               order.status === 'delivered' ? <CheckCircle2 size={14} /> :
               order.status === 'canceled' ? <XCircle size={14} /> :
               <Clock size={14} />}
              {getStatusText(order.status)}
            </span>
          </div>

          {/* Order Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[var(--primary)] to-orange-400 flex items-center justify-center shadow-lg shrink-0">
                <Package size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {t('orderNumber')} #{order.id}
                </h1>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Calendar size={14} />
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
              <div className="text-end shrink-0 hidden sm:block">
                <p className="text-2xl font-bold text-white">{order.total_price.toFixed(3)}</p>
                <p className="text-white/50 text-sm">{tCommon('sar')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-10 sm:h-12" preserveAspectRatio="none">
            <path d="M0 40L60 36C120 32 240 24 360 20C480 16 600 16 720 18C840 20 960 26 1080 30C1200 34 1320 36 1380 37L1440 38V40H0Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Order Progress with Percentage */}
        {order.status !== 'canceled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100"
            style={{ padding: '18px 20px', marginBottom: '20px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Truck size={18} className="text-[var(--primary)]" />
                {t('orderStatus')}
              </h2>
              <span className="text-xl font-bold text-[var(--primary)]">
                {getProgressPercentage(order.status)}%
              </span>
            </div>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-6 right-6 h-1.5 bg-gray-200 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-orange-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${getProgressPercentage(order.status)}%` 
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {ORDER_STEPS.map((step, index) => {
                  const isCompleted = index <= getCurrentStepIndex();
                  const isCurrent = index === getCurrentStepIndex();
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center">
                      <motion.div
                        className={clsx(
                          'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center z-10 transition-all shadow-md',
                          isCompleted
                            ? 'bg-gradient-to-br from-[var(--primary)] to-orange-400 text-white'
                            : 'bg-white border-2 border-gray-200 text-gray-400'
                        )}
                        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                      >
                        {step.status === 'new' && <Clock size={16} />}
                        {step.status === 'accepted' && <CheckCircle2 size={16} />}
                        {step.status === 'ready' && <Package size={16} />}
                        {step.status === 'on_a_way' && <Truck size={16} />}
                        {step.status === 'delivered' && <CheckCircle2 size={16} />}
                      </motion.div>
                      <span className={clsx(
                        'text-[10px] sm:text-xs mt-1.5 text-center font-medium',
                        isCompleted ? 'text-[var(--primary)]' : 'text-gray-400'
                      )}>
                        {getStatusText(step.status)}
                      </span>
                      <span className={clsx(
                        'text-[9px] sm:text-[10px] mt-0.5',
                        isCompleted ? 'text-[var(--primary)]/70' : 'text-gray-300'
                      )}>
                        {step.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cancelled Order Banner */}
        {order.status === 'canceled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl mb-4"
            style={{ padding: '14px 18px' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-700 text-sm">تم إلغاء هذا الطلب</p>
                <p className="text-xs text-red-600/70">يمكنك إعادة الطلب من المتجر</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Shop Info with Call Button */}
            {order.shop && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl shadow-sm border border-gray-100"
                style={{ padding: '16px 18px' }}
              >
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Store size={16} className="text-[var(--primary)]" />
                  {isRTL ? 'المتجر' : 'Shop'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                    {order.shop.logo_img ? (
                      <Image
                        src={order.shop.logo_img}
                        alt={order.shop.translation?.title || ''}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-orange-400">
                        <Store size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {order.shop.translation?.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('orderNumber')} #{order.id}
                    </p>
                  </div>
                  {order.shop.phone && (
                    <a href={`tel:${order.shop.phone}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-[var(--primary)] text-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-white"
                        style={{ padding: '10px 16px' }}
                      >
                        <Phone size={16} className="me-1" />
                        {isRTL ? 'اتصال' : 'Call'}
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Map Section */}
            {hasValidMapLocations && order.status !== 'canceled' && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100"
                style={{ padding: '16px 18px' }}
              >
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation size={16} className="text-[var(--primary)]" />
                  {isRTL ? 'تتبع الطلب' : 'Track Order'}
                </h2>
                <OrderTrackingMap
                  shopLocation={shopLocation}
                  deliveryLocation={deliveryLocation}
                  driverLocation={driverLocation}
                  status={order.status}
                  isRTL={isRTL}
                />
              </motion.div>
            )}

            {/* Delivery Man - Show when assigned */}
            {order.delivery_man && !['canceled', 'new'].includes(order.status) && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className={clsx(
                  'rounded-2xl border',
                  order.status === 'on_a_way' 
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200'
                    : order.status === 'delivered'
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
                    : 'bg-white border-gray-100 shadow-sm'
                )}
                style={{ padding: '16px 18px' }}
              >
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck size={16} className={clsx(
                    order.status === 'on_a_way' ? 'text-cyan-600' :
                    order.status === 'delivered' ? 'text-emerald-600' : 'text-gray-600'
                  )} />
                  {order.status === 'on_a_way' 
                    ? (isRTL ? 'السائق في الطريق إليك' : 'Driver is on the way')
                    : order.status === 'delivered'
                    ? (isRTL ? 'تم التوصيل بواسطة' : 'Delivered by')
                    : (isRTL ? 'السائق المعين' : 'Assigned Driver')}
                </h2>
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden',
                    order.status === 'on_a_way' ? 'bg-white' :
                    order.status === 'delivered' ? 'bg-white' : 'bg-gray-50'
                  )}>
                    {order.delivery_man.img ? (
                      <Image
                        src={order.delivery_man.img}
                        alt=""
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Truck size={24} className={clsx(
                        order.status === 'on_a_way' ? 'text-cyan-500' :
                        order.status === 'delivered' ? 'text-emerald-500' : 'text-gray-400'
                      )} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      {order.delivery_man.firstname} {order.delivery_man.lastname}
                    </p>
                    {order.delivery_man.rating_avg && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        {typeof order.delivery_man.rating_avg === 'number' 
                          ? order.delivery_man.rating_avg.toFixed(1) 
                          : order.delivery_man.rating_avg}
                      </div>
                    )}
                  </div>
                  {order.delivery_man.phone && order.status !== 'delivered' && (
                    <a href={`tel:${order.delivery_man.phone}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={clsx(
                          'rounded-xl',
                          order.status === 'on_a_way' 
                            ? 'border-cyan-400 text-cyan-600 hover:!bg-cyan-500 hover:!text-white'
                            : 'border-gray-300 text-gray-600 hover:!bg-gray-100'
                        )}
                        style={{ padding: '10px 16px' }}
                      >
                        <Phone size={16} className="me-1" />
                        {isRTL ? 'اتصال' : 'Call'}
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100"
              style={{ padding: '16px 18px' }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={16} className="text-[var(--primary)]" />
                {isRTL ? 'المنتجات' : 'Products'}
                <span className="text-sm font-normal text-gray-400">({order.details?.length || 0})</span>
              </h2>
              <div className="space-y-2">
                {order.details?.map((item: OrderDetail) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl"
                    style={{ padding: '12px 14px' }}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                      <Package size={18} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.stock?.product?.translation?.title || `${isRTL ? 'منتج' : 'Product'} #${item.stock?.id || item.id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isRTL ? 'الكمية:' : 'Qty:'} <span className="font-semibold">{item.quantity}</span>
                      </p>
                    </div>
                    <p className="font-bold text-[var(--primary)] shrink-0">
                      {item.total_price.toFixed(3)}
                      <span className="text-xs text-gray-400 ms-1">{tCommon('sar')}</span>
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Delivery Info */}
            {(() => {
              const deliveryAddress = getDeliveryAddress(order);
              return deliveryAddress ? (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100"
                  style={{ padding: '16px 18px' }}
                >
                  <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-[var(--primary)]" />
                    {isRTL ? 'عنوان التوصيل' : 'Delivery Address'}
                  </h2>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary)]/10 to-orange-100 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-gray-900">{deliveryAddress}</p>
                      {order.delivery_date && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar size={14} />
                          {order.delivery_date} {order.delivery_time && `- ${order.delivery_time}`}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null;
            })()}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-2" style={{ marginTop: '4px' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 lg:sticky lg:top-24"
              style={{ padding: '18px 20px' }}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h2>
              </div>

              {/* Summary Details */}
              <div className="space-y-2.5 pb-3 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="font-medium text-gray-900">
                    {(order.total_price - (order.delivery_fee || 0) - (order.tax || 0) - (order.service_fee || 0) + (order.discount || 0) + (order.coupon_price || 0)).toFixed(3)} {tCommon('sar')}
                  </span>
                </div>

                {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{isRTL ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                    <span className="font-medium text-gray-900">
                      {order.delivery_fee.toFixed(3)} {tCommon('sar')}
                    </span>
                  </div>
                )}

                {order.service_fee !== undefined && order.service_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{isRTL ? 'رسوم الخدمة' : 'Service Fee'}</span>
                    <span className="font-medium text-gray-900">
                      {order.service_fee.toFixed(3)} {tCommon('sar')}
                    </span>
                  </div>
                )}

                {order.tax !== undefined && order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{isRTL ? 'الضريبة' : 'Tax'}</span>
                    <span className="font-medium text-gray-900">
                      {order.tax.toFixed(3)} {tCommon('sar')}
                    </span>
                  </div>
                )}

                {((order.discount || 0) + (order.coupon_price || 0)) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Gift size={14} />
                      {isRTL ? 'الخصم' : 'Discount'}
                    </span>
                    <span className="font-medium">
                      -{((order.discount || 0) + (order.coupon_price || 0)).toFixed(3)} {tCommon('sar')}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-3">
                <span className="text-base font-bold text-gray-900">{isRTL ? 'الإجمالي' : 'Total'}</span>
                <div className="text-end">
                  <span className="text-xl font-bold text-[var(--primary)]">
                    {order.total_price.toFixed(3)}
                  </span>
                  <span className="text-xs font-medium text-gray-400 ms-1">{tCommon('sar')}</span>
                </div>
              </div>

              {/* Payment Info */}
              {order.transaction && (
                <div className="flex items-center gap-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl mb-4" style={{ padding: '12px 14px' }}>
                  <CreditCard size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600 flex-1">
                    {order.transaction.payment_system?.tag === 'cash' 
                      ? (isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery')
                      : (isRTL ? 'تم الدفع إلكترونياً' : 'Paid Online')}
                  </span>
                  <Badge 
                    variant={order.transaction.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {order.transaction.status === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'معلق' : 'Pending')}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5">
                {canRate && (
                  <Button
                    fullWidth
                    onClick={() => setShowRatingModal(true)}
                    className="rounded-xl !bg-gradient-to-r !from-yellow-400 !to-orange-400 shadow-lg shadow-orange-200"
                    style={{ padding: '12px 18px' }}
                  >
                    <Star size={16} className="me-2" />
                    {t('rateOrder')}
                  </Button>
                )}

                {(order.status === 'delivered' || order.status === 'canceled') && (
                  <Button
                    fullWidth
                    variant={canRate ? 'outline' : 'primary'}
                    onClick={handleReorder}
                    className={clsx(
                      'rounded-xl',
                      !canRate && '!bg-gradient-to-r !from-[var(--primary)] !to-orange-500 shadow-lg shadow-orange-200'
                    )}
                    style={{ padding: '12px 18px' }}
                  >
                    <RefreshCw size={16} className="me-2" />
                    {t('reorder')}
                  </Button>
                )}

                {canCancel && (
                  <Button
                    fullWidth
                    variant="outline"
                    className="rounded-xl text-red-500 border-red-300 hover:!bg-red-50"
                    onClick={() => setShowCancelModal(true)}
                    style={{ padding: '12px 18px' }}
                  >
                    <XCircle size={16} className="me-2" />
                    {t('cancelOrder')}
                  </Button>
                )}
              </div>

              {/* Order Note */}
              {order.note && (
                <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl" style={{ padding: '12px 14px' }}>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                    <MessageSquare size={12} />
                    <span className="font-medium">{isRTL ? 'ملاحظات' : 'Notes'}</span>
                  </div>
                  <p className="text-sm text-gray-700">{order.note}</p>
                </div>
              )}
            </motion.div>

            {/* Back to Orders */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-center"
            >
              <Link href="/orders">
                <Button variant="ghost" className="text-gray-500 hover:text-[var(--primary)]" style={{ padding: '12px 24px' }}>
                  <Package className="w-4 h-4 me-2" />
                  {isRTL ? 'جميع الطلبات' : 'All Orders'}
                  <ArrowIcon className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('cancelOrder')}
        size="sm"
      >
        <div
          className="text-center"
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(248, 113, 113, 0.05) 100%)'
          }}
        >
          <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">{isRTL ? 'إلغاء الطلب' : 'Cancel Order'}</h3>
          <p className="text-sm text-gray-600 mb-5">
            {isRTL ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?'}
          </p>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCancelModal(false)}
              className="rounded-xl"
              style={{ padding: '12px 18px' }}
            >
              {tCommon('back')}
            </Button>
            <Button
              fullWidth
              className="rounded-xl !bg-red-500 hover:!bg-red-600"
              onClick={handleCancelOrder}
              isLoading={cancelLoading}
              style={{ padding: '12px 18px' }}
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
        size="sm"
      >
        <div
          className="space-y-4"
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)'
          }}
        >
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">{isRTL ? 'كيف كانت تجربتك مع هذا الطلب؟' : 'How was your experience with this order?'}</p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(star)}
                  style={{ padding: '6px' }}
                >
                  <Star
                    size={32}
                    className={clsx(
                      'transition-colors',
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <Input
            label={isRTL ? 'تعليق (اختياري)' : 'Comment (optional)'}
            placeholder={isRTL ? 'شاركنا رأيك...' : 'Share your feedback...'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex gap-2.5">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowRatingModal(false)}
              className="rounded-xl"
              style={{ padding: '12px 18px' }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleRateOrder}
              isLoading={ratingLoading}
              disabled={rating === 0}
              className="rounded-xl !bg-gradient-to-r !from-yellow-400 !to-orange-400"
              style={{ padding: '12px 18px' }}
            >
              <Star size={16} className="me-2" />
              {isRTL ? 'إرسال التقييم' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetailsPage;
