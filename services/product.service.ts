import { get, post } from './api';
import { ApiResponse, PaginatedResponse, Product, Review } from '@/types';

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
  deals?: boolean;
}

interface ReviewData {
  rating: number;
  comment?: string;
}

export const productService = {
  // Get products with pagination and filters
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    return get('/api/v1/rest/products/paginate', filters);
  },

  // Get single product details
  getProductDetails: async (uuid: string): Promise<ApiResponse<Product>> => {
    return get(`/api/v1/rest/products/${uuid}`);
  },

  // Search products
  searchProducts: async (query: string, params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    return get('/api/v1/rest/products/paginate', { search: query, ...params });
  },

  // Get similar products
  getSimilarProducts: async (categoryId: number, excludeId?: number): Promise<PaginatedResponse<Product>> => {
    return get('/api/v1/rest/products/paginate', { 
      category_id: categoryId,
      exclude_id: excludeId,
      perPage: 10 
    });
  },

  // Get products by IDs (for favorites)
  getProductsByIds: async (ids: number[]): Promise<PaginatedResponse<Product>> => {
    return get('/api/v1/rest/products/ids', { ids: ids.join(',') });
  },

  // Search categories
  searchCategories: async (query: string): Promise<PaginatedResponse<Product>> => {
    return get('/api/v1/rest/categories/search', { search: query });
  },

  // Add product review
  addReview: async (productUuid: string, data: ReviewData): Promise<ApiResponse<void>> => {
    return post(`/api/v1/rest/products/review/${productUuid}`, data);
  },

  // Get product reviews
  getProductReviews: async (productUuid: string, params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Review>> => {
    return get(`/api/v1/rest/products/${productUuid}/reviews`, params);
  },
};

