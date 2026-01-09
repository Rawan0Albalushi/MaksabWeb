import { get } from './api';
import { ApiResponse, PaginatedResponse, Language, Currency, GlobalSettings, FAQ } from '@/types';

interface TranslationsResponse {
  [key: string]: string;
}

export const settingsService = {
  // Get global settings
  getSettings: async (): Promise<ApiResponse<GlobalSettings>> => {
    return get('/api/v1/rest/settings');
  },

  // Get active languages
  getLanguages: async (): Promise<ApiResponse<Language[]>> => {
    return get('/api/v1/rest/languages/active');
  },

  // Get translations
  getTranslations: async (locale: string): Promise<ApiResponse<TranslationsResponse>> => {
    return get('/api/v1/rest/translations/paginate', { lang: locale });
  },

  // Get active currencies
  getCurrencies: async (): Promise<ApiResponse<Currency[]>> => {
    return get('/api/v1/rest/currencies/active');
  },

  // Get FAQ
  getFaq: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<FAQ>> => {
    return get('/api/v1/rest/faqs/paginate', params);
  },

  // Get terms and conditions
  getTerms: async (): Promise<ApiResponse<{ title: string; description: string }>> => {
    return get('/api/v1/rest/term');
  },

  // Get privacy policy
  getPrivacyPolicy: async (): Promise<ApiResponse<{ title: string; description: string }>> => {
    return get('/api/v1/rest/policy');
  },
};

