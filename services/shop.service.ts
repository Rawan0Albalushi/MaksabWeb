import { get, post } from './api';
import { ApiResponse, PaginatedResponse, Shop, Category, Product, Banner, Story, PriceRange } from '@/types';

interface ShopFilters {
  page?: number;
  perPage?: number;
  category_id?: number;
  brand_id?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  open?: boolean;
  delivery?: string;
  take?: string;
  rating?: string;
  deals?: boolean;
  free_delivery?: boolean;
  has_discount?: boolean;
  // Location-based filters
  latitude?: number;
  longitude?: number;
  address?: Record<string, unknown>;
}

interface ProductFilters {
  page?: number;
  perPage?: number;
  category_id?: number;
  shop_id?: number;
  brand_id?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  min_price?: number;
  max_price?: number;
  rating?: number;
}

// Helper to convert params to API format (removes undefined values)
const formatParams = (params?: { page?: number; perPage?: number }) => {
  if (!params) return undefined;
  const result: Record<string, unknown> = {};
  if (params.page !== undefined) result.page = params.page;
  if (params.perPage !== undefined) result.per_page = params.perPage;
  return Object.keys(result).length > 0 ? result : undefined;
};

export const shopService = {
  // Get main/parent categories only (parent_id = null)
  getCategories: async (): Promise<PaginatedResponse<Category>> => {
    return get('/api/v1/rest/categories/parent', { type: 'main' });
  },

  // Get categories with pagination and type filter
  getCategoriesPaginate: async (params?: { page?: number; perPage?: number; type?: string }): Promise<PaginatedResponse<Category>> => {
    const apiParams = {
      ...formatParams(params),
      type: params?.type || 'main',
    };
    return get('/api/v1/rest/categories/paginate', apiParams);
  },

  // Get children categories for a specific parent
  getChildCategories: async (parentId: number): Promise<PaginatedResponse<Category>> => {
    return get(`/api/v1/rest/categories/children/${parentId}`);
  },

  // Search categories
  searchCategories: async (search: string, type?: string): Promise<PaginatedResponse<Category>> => {
    const params: Record<string, unknown> = { search };
    if (type) params.type = type;
    return get('/api/v1/rest/categories/search', params);
  },

  // Get shops with pagination and filters
  getShops: async (filters?: ShopFilters): Promise<PaginatedResponse<Shop>> => {
    if (!filters) return get('/api/v1/rest/shops/paginate');
    
    // Clean up undefined values and convert perPage to per_page
    const apiParams: Record<string, unknown> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert perPage to per_page for API compatibility
        const apiKey = key === 'perPage' ? 'per_page' : key;
        apiParams[apiKey] = value;
      }
    });
    
    return get('/api/v1/rest/shops/paginate', apiParams);
  },

  // Get recommended shops
  getRecommendedShops: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Shop>> => {
    return get('/api/v1/rest/shops/recommended', formatParams(params));
  },

  // Get family shops
  getFamilyShops: async (lat?: number, lng?: number, params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Shop>> => {
    const apiParams: Record<string, unknown> = { ...formatParams(params) };
    if (lat !== undefined && lng !== undefined) {
      apiParams['address[latitude]'] = lat;
      apiParams['address[longitude]'] = lng;
    }
    return get('/api/v1/rest/shops/families/paginate', apiParams);
  },

  // Get Ruwad shops
  getRuwadShops: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Shop>> => {
    return get('/api/v1/rest/shops/ruwad/paginate', formatParams(params));
  },

  // Get single shop details
  getShopDetails: async (uuid: string): Promise<ApiResponse<Shop>> => {
    return get(`/api/v1/rest/shops/${uuid}`);
  },

  // Get shop branches
  getShopBranches: async (shopId: number): Promise<ApiResponse<Shop[]>> => {
    return get('/api/v1/rest/branches', { shop_id: shopId });
  },

  // Get shop categories
  getShopCategories: async (shopId: number): Promise<PaginatedResponse<Category>> => {
    return get(`/api/v1/rest/shops/${shopId}/categories`);
  },

  // Get shop products
  getShopProducts: async (shopId: number, params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    if (!params) return get(`/api/v1/rest/shops/${shopId}/products/paginate`);
    
    // Clean up undefined values and convert perPage to per_page
    const apiParams: Record<string, unknown> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert perPage to per_page for API compatibility
        const apiKey = key === 'perPage' ? 'per_page' : key;
        apiParams[apiKey] = value;
      }
    });
    
    return get(`/api/v1/rest/shops/${shopId}/products/paginate`, apiParams);
  },

  // Get shop all products with categories
  getShopAllProducts: async (shopId: number): Promise<ApiResponse<{ all: Category[]; recommended: Product[] }>> => {
    return get(`/api/v1/rest/shops/${shopId}/products`);
  },

  // Get recommended products in shop
  getShopRecommendedProducts: async (shopId: number, params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Product>> => {
    return get(`/api/v1/rest/shops/${shopId}/products/recommended/paginate`, formatParams(params));
  },

  // Search shops
  searchShops: async (query: string, params?: ShopFilters): Promise<PaginatedResponse<Shop>> => {
    const apiParams: Record<string, unknown> = { search: query };
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert perPage to per_page for API compatibility
          const apiKey = key === 'perPage' ? 'per_page' : key;
          apiParams[apiKey] = value;
        }
      });
    }
    return get('/api/v1/rest/shops/search', apiParams);
  },

  // Get nearby shops - uses regular paginate endpoint with location params
  getNearbyShops: async (lat: number, lng: number, params?: ShopFilters): Promise<PaginatedResponse<Shop>> => {
    const apiParams: Record<string, unknown> = { 
      'address[latitude]': lat, 
      'address[longitude]': lng 
    };
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert perPage to per_page for API compatibility
          const apiKey = key === 'perPage' ? 'per_page' : key;
          apiParams[apiKey] = value;
        }
      });
    }
    return get('/api/v1/rest/shops/paginate', apiParams);
  },

  // Get banners
  getBanners: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Banner>> => {
    return get('/api/v1/rest/banners/paginate', formatParams(params));
  },

  // Get ads banners
  getAdsBanners: async (): Promise<PaginatedResponse<Banner>> => {
    return get('/api/v1/rest/banners-ads');
  },

  // Get single banner
  getBannerDetails: async (bannerId: number): Promise<ApiResponse<Banner>> => {
    return get(`/api/v1/rest/banners/${bannerId}`);
  },

  // Get stories
  getStories: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Story>> => {
    return get('/api/v1/rest/stories/paginate', formatParams(params));
  },

  // Get average prices
  getAveragePrices: async (): Promise<ApiResponse<PriceRange>> => {
    return get('/api/v1/rest/products-avg-prices');
  },

  // Check delivery zone
  checkDeliveryZone: async (shopId: number, lat: number, lng: number): Promise<ApiResponse<{ status: boolean }>> => {
    return get(`/api/v1/rest/shop/${shopId}/delivery-zone/check/distance`, { latitude: lat, longitude: lng });
  },
};
