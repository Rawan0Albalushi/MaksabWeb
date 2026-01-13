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

  // Add product to cart (handles cart creation automatically)
  addToCart: async (data: CartProductData): Promise<ApiResponse<Cart>> => {
    console.log('🛒 Adding to cart:', data);
    
    // Get currency_id (required for both endpoints)
    let currencyId: number = 2; // Default to 2 (OMR)
    
    if (typeof window !== 'undefined') {
      const storedCurrencyId = localStorage.getItem('currency_id');
      if (storedCurrencyId) {
        currencyId = parseInt(storedCurrencyId, 10);
      }
    }
    
    // Data for INSERT-PRODUCT (existing cart) - requires products[] array + currency_id
    const insertProductData = {
      shop_id: data.shop_id,
      currency_id: currencyId,
      products: [
        {
          stock_id: data.stock_id,
          quantity: data.quantity,
          ...(data.addons && { parent_id: data.addons[0]?.stock_id }),
        },
      ],
    };
    
    // Data for CREATE CART (new cart) - flat structure, single product
    const createCartData = {
      shop_id: data.shop_id,
      currency_id: currencyId,
      stock_id: data.stock_id,
      quantity: data.quantity,
    };
    
    console.log('📤 Insert data:', insertProductData);
    console.log('📤 Create data:', createCartData);
    
    // Try to add to existing cart first using insert-product
    try {
      const result = await post<ApiResponse<Cart>>('/api/v1/dashboard/user/cart/insert-product', insertProductData);
      console.log('✅ Product added to existing cart');
      console.log('✅ INSERT RESPONSE:', result);
      console.log('✅ Cart data:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; statusCode?: string }; status?: number } };
      const errorMessage = axiosError?.response?.data?.message;
      const statusCode = axiosError?.response?.data?.statusCode;
      const httpStatus = axiosError?.response?.status;
      
      console.log('❌ Insert-product failed:', { errorMessage, statusCode, httpStatus });
      
      // If cart doesn't exist, create new cart
      if (httpStatus === 404 || statusCode === 'ERROR_404' || errorMessage?.toLowerCase().includes('not found') || errorMessage?.toLowerCase().includes('cart')) {
        console.log('📦 No cart exists, creating new cart...');
        return post<ApiResponse<Cart>>('/api/v1/dashboard/user/cart', createCartData);
      }
      
      // If cart exists for different shop, delete and create new
      if (statusCode === 'ERROR_440' || errorMessage === 'Other shop' || errorMessage?.toLowerCase().includes('other shop')) {
        console.log('⚠️ Cart exists for different shop, clearing and creating new...');
        
        // First, try to get current cart to find its ID
        try {
          console.log('📋 Getting current cart info...');
          const currentCart = await get<ApiResponse<Cart>>('/api/v1/dashboard/user/cart');
          console.log('📋 Current cart:', currentCart);
          
          if (currentCart?.data?.id) {
            console.log(`🗑️ Deleting cart with ID: ${currentCart.data.id}`);
            // Try deleting with cart_id parameter
            await del<ApiResponse<void>>('/api/v1/dashboard/user/cart/delete', { 
              ids: [currentCart.data.id] 
            });
          }
        } catch (getCartError) {
          console.log('Could not get cart, trying simple delete...');
        }
        
        // Also try simple delete without params
        try {
          console.log('🗑️ Attempting simple delete...');
          await del<ApiResponse<void>>('/api/v1/dashboard/user/cart/delete');
          console.log('✅ Delete request sent');
        } catch (deleteError: unknown) {
          const delErr = deleteError as { response?: { status?: number } };
          // 404 means cart is already gone - that's fine
          if (delErr?.response?.status !== 404) {
            console.warn('Delete error:', deleteError);
          }
        }
        
        // Wait for server to process
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create new cart with flat structure
        console.log('🔄 Creating new cart with data:', createCartData);
        try {
          const createResult = await post<ApiResponse<Cart>>('/api/v1/dashboard/user/cart', createCartData);
          console.log('✅ CREATE CART RESPONSE:', createResult);
          console.log('✅ Cart data:', JSON.stringify(createResult, null, 2));
          return createResult;
        } catch (createErr: unknown) {
          const createAxiosErr = createErr as { response?: { data?: unknown; status?: number } };
          console.error('❌ CREATE CART FAILED!');
          console.error('Response data:', createAxiosErr?.response?.data);
          throw createErr;
        }
      }
      
      // Re-throw other errors
      throw error;
    }
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

