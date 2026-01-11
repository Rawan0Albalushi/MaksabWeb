import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'https://uatapi.maksab.om';

// Default location (Muscat, Oman)
const DEFAULT_LOCATION = {
  latitude: 23.5880,
  longitude: 58.3829,
};

// Endpoints that require location parameters
const LOCATION_REQUIRED_ENDPOINTS = [
  '/api/v1/rest/shops/paginate',
  '/api/v1/rest/shops/recommended',
  '/api/v1/rest/shops/families/paginate',
  '/api/v1/rest/shops/ruwad/paginate',
  '/api/v1/rest/shops/search',
  '/api/v1/rest/shops/nearby',
];

// Helper to get selected location from localStorage
const getSelectedLocation = (): { latitude: number; longitude: number } => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCATION;
  }

  try {
    const locationData = localStorage.getItem('location-storage');
    if (locationData) {
      const parsed = JSON.parse(locationData);
      const state = parsed.state;
      
      // Check selectedAddress first
      if (state?.selectedAddress?.location) {
        return {
          latitude: state.selectedAddress.location.latitude,
          longitude: state.selectedAddress.location.longitude,
        };
      }
      
      // Then check currentLocation
      if (state?.currentLocation) {
        return {
          latitude: state.currentLocation.latitude,
          longitude: state.currentLocation.longitude,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse location from storage:', e);
  }

  return DEFAULT_LOCATION;
};

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

    // Add location for shop-related endpoints
    const url = config.url || '';
    const shouldAddLocation = LOCATION_REQUIRED_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    if (shouldAddLocation) {
      // Only add location if not already provided
      if (!config.params?.['address[latitude]'] && !config.params?.latitude) {
        const location = getSelectedLocation();
        config.params = {
          ...config.params,
          'address[latitude]': location.latitude,
          'address[longitude]': location.longitude,
        };
      }
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
