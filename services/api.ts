import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'https://uatapi.maksab.om';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    // Always add lang parameter (default to 'ar')
    let locale = 'ar';
    let currencyId: string | null = null;
    let token: string | null = null;

    // Get values from localStorage if available
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      locale = localStorage.getItem('locale') || 'ar';
      currencyId = localStorage.getItem('currency_id');
    }

    // Set Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Always add lang parameter
    config.params = {
      ...config.params,
      lang: locale,
    };

    // Add currency if available
    if (currencyId) {
      config.params = {
        ...config.params,
        currency_id: currencyId,
      };
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Only log detailed errors in development mode
    if (process.env.NODE_ENV === 'development' && error.response) {
      // Use warn instead of error for non-critical failures
      console.warn('API Request Failed:', {
        status: error.response.status,
        url: error.config?.url,
      });
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function for GET requests
export const get = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

// Helper function for POST requests
export const post = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

// Helper function for PUT requests
export const put = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};

// Helper function for DELETE requests
export const del = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await api.delete<T>(url, { params });
  return response.data;
};

// Helper function for multipart form data
export const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await api.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

