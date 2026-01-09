import { get, post, del } from './api';
import { ApiResponse, PaginatedResponse, Order, OrderStatus } from '@/types';

interface CreateOrderData {
  cart_id: number;
  delivery_type: 'delivery' | 'pickup';
  address_id?: number;
  delivery_date?: string;
  delivery_time?: string;
  note?: string;
  coupon?: string;
  payment_id?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface TransactionData {
  payment_sys_id: number;
}

interface ReviewOrderData {
  rating: number;
  comment?: string;
}

interface RefundData {
  order_id: number;
  cause: string;
}

export const orderService = {
  // Get active orders
  getActiveOrders: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Order>> => {
    return get('/api/v1/dashboard/user/orders/paginate', { status: 'new,accepted,ready,on_a_way', ...params });
  },

  // Get completed orders
  getCompletedOrders: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Order>> => {
    return get('/api/v1/dashboard/user/orders/paginate', { status: 'delivered', ...params });
  },

  // Get cancelled orders
  getCancelledOrders: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Order>> => {
    return get('/api/v1/dashboard/user/orders/paginate', { status: 'canceled', ...params });
  },

  // Get all orders
  getAllOrders: async (params?: { page?: number; perPage?: number; status?: string }): Promise<PaginatedResponse<Order>> => {
    return get('/api/v1/dashboard/user/orders/paginate', params);
  },

  // Get order details
  getOrderDetails: async (orderId: number): Promise<ApiResponse<Order>> => {
    return get(`/api/v1/dashboard/user/orders/${orderId}`);
  },

  // Create new order
  createOrder: async (data: CreateOrderData): Promise<ApiResponse<Order>> => {
    return post('/api/v1/dashboard/user/orders', data);
  },

  // Cancel order
  cancelOrder: async (orderId: number): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/user/orders/${orderId}/status/change`, { status: 'canceled' });
  },

  // Create payment transaction
  createTransaction: async (orderId: number, data: TransactionData): Promise<ApiResponse<{ id: number }>> => {
    return post(`/api/v1/payments/order/${orderId}/transactions`, data);
  },

  // Process payment
  processPayment: async (paymentName: string, orderId: number): Promise<ApiResponse<{ payment_url: string }>> => {
    return get(`/api/v1/dashboard/user/order-${paymentName}-process`, { order_id: orderId });
  },

  // Get payment methods
  getPaymentMethods: async (): Promise<ApiResponse<Array<{ id: number; tag: string; input?: number }>>> => {
    return get('/api/v1/rest/payments');
  },

  // Review order
  reviewOrder: async (orderId: number, data: ReviewOrderData): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/user/orders/review/${orderId}`, data);
  },

  // Get delivery man location
  getDeliveryManLocation: async (deliveryId: number): Promise<ApiResponse<{ latitude: number; longitude: number }>> => {
    return get(`/api/v1/rest/orders/deliveryman/${deliveryId}`);
  },

  // Request refund
  requestRefund: async (data: RefundData): Promise<ApiResponse<void>> => {
    return post('/api/v1/dashboard/user/order-refunds', data);
  },

  // Get refund orders
  getRefundOrders: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Order>> => {
    return get('/api/v1/dashboard/user/order-refunds/paginate', params);
  },

  // Set auto order
  setAutoOrder: async (orderId: number, interval: string): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/user/orders/${orderId}/repeat`, { interval });
  },

  // Delete auto order
  deleteAutoOrder: async (orderId: number): Promise<ApiResponse<void>> => {
    return del(`/api/v1/dashboard/user/orders/${orderId}/delete-repeat`);
  },
};

