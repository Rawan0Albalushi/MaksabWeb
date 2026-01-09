import { get, post, del } from './api';
import { ApiResponse, Cart, CalculateResult, Coupon } from '@/types';

interface CartProductData {
  shop_id: number;
  stock_id: number;
  quantity: number;
  addons?: Array<{
    stock_id: number;
    quantity: number;
  }>;
}

interface CalculateData {
  delivery_type?: string;
  delivery_fee?: number;
  coupon?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const cartService = {
  // Get user cart
  getCart: async (): Promise<ApiResponse<Cart>> => {
    return get('/api/v1/dashboard/user/cart');
  },

  // Create new cart
  createCart: async (shopId: number): Promise<ApiResponse<Cart>> => {
    return post('/api/v1/dashboard/user/cart/open', { shop_id: shopId });
  },

  // Add product to cart
  addToCart: async (data: CartProductData): Promise<ApiResponse<Cart>> => {
    return post('/api/v1/dashboard/user/cart/insert-product', data);
  },

  // Update product quantity in cart
  updateCartProduct: async (data: CartProductData): Promise<ApiResponse<Cart>> => {
    return post('/api/v1/dashboard/user/cart/insert-product', data);
  },

  // Delete cart
  deleteCart: async (): Promise<ApiResponse<void>> => {
    return del('/api/v1/dashboard/user/cart/delete');
  },

  // Delete product from cart
  deleteCartProduct: async (cartDetailId: number): Promise<ApiResponse<void>> => {
    return del('/api/v1/dashboard/user/cart/product/delete', { cart_detail_id: cartDetailId });
  },

  // Calculate cart totals
  calculateCart: async (cartId: number, data: CalculateData): Promise<ApiResponse<CalculateResult>> => {
    return post(`/api/v1/dashboard/user/cart/calculate/${cartId}`, data);
  },

  // Check coupon
  checkCoupon: async (shopId: number, coupon: string): Promise<ApiResponse<Coupon>> => {
    return post('/api/v1/rest/coupons/check', { shop_id: shopId, coupon });
  },

  // Check cashback
  checkCashback: async (amount: number): Promise<ApiResponse<{ price: number; percent: number }>> => {
    return post('/api/v1/rest/cashback/check', { amount });
  },

  // ===== Group Order Methods =====
  
  // Start group order
  startGroupOrder: async (cartId: number): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/user/cart/set-group/${cartId}`);
  },

  // Join group order
  joinGroupOrder: async (uuid: string): Promise<ApiResponse<Cart>> => {
    return post('/api/v1/rest/cart/open', { uuid });
  },

  // Get group cart
  getGroupCart: async (cartId: number): Promise<ApiResponse<Cart>> => {
    return get(`/api/v1/rest/cart/${cartId}`);
  },

  // Add product to group cart
  addToGroupCart: async (data: CartProductData & { cart_id: number }): Promise<ApiResponse<Cart>> => {
    return post('/api/v1/rest/cart/insert-product', data);
  },

  // Change user status in group cart
  changeUserStatus: async (userUuid: string, status: string): Promise<ApiResponse<void>> => {
    return post(`/api/v1/rest/cart/status/${userUuid}`, { status });
  },

  // Remove member from group cart
  removeMember: async (userCartId: number): Promise<ApiResponse<void>> => {
    return del('/api/v1/dashboard/user/cart/member/delete', { user_cart_id: userCartId });
  },
};

