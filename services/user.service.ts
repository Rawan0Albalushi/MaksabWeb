import { get, post, put, del, postFormData } from './api';
import { ApiResponse, PaginatedResponse, User, Address, WalletHistory, Notification, Referral } from '@/types';

interface UpdateProfileData {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female';
  birthday?: string;
}

interface UpdatePasswordData {
  password: string;
  password_confirmation: string;
}

interface AddressData {
  title: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  street_house_number?: string;
  additional_details?: string;
}

interface NotificationSettings {
  [key: string]: boolean;
}

export const userService = {
  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return get('/api/v1/dashboard/user/profile/show');
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<User>> => {
    return put('/api/v1/dashboard/user/profile/update', data);
  },

  // Update password
  updatePassword: async (data: UpdatePasswordData): Promise<ApiResponse<User>> => {
    return post('/api/v1/dashboard/user/profile/password/update', data);
  },

  // Upload image
  uploadImage: async (file: File): Promise<ApiResponse<{ title: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'users');
    return postFormData('/api/v1/dashboard/galleries', formData);
  },

  // Delete account
  deleteAccount: async (): Promise<ApiResponse<void>> => {
    return del('/api/v1/dashboard/user/profile/delete');
  },

  // ===== Addresses =====

  // Get addresses
  getAddresses: async (): Promise<ApiResponse<Address[]>> => {
    return get('/api/v1/dashboard/user/addresses');
  },

  // Add address
  addAddress: async (data: AddressData): Promise<ApiResponse<Address>> => {
    return post('/api/v1/dashboard/user/addresses', data);
  },

  // Update address
  updateAddress: async (addressId: number, data: AddressData): Promise<ApiResponse<void>> => {
    return put(`/api/v1/dashboard/user/addresses/${addressId}`, data);
  },

  // Delete address
  deleteAddress: async (addressId: number): Promise<ApiResponse<void>> => {
    return del(`/api/v1/dashboard/user/addresses/${addressId}`);
  },

  // Set active address
  setActiveAddress: async (addressId: number): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/user/address/set-active/${addressId}`);
  },

  // ===== Wallet =====

  // Get wallet history
  getWalletHistory: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<WalletHistory>> => {
    return get('/api/v1/dashboard/user/wallet/histories', params);
  },

  // ===== Notifications =====

  // Get notifications
  getNotifications: async (params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Notification>> => {
    return get('/api/v1/dashboard/notifications', params);
  },

  // Mark all as read
  markAllNotificationsRead: async (): Promise<ApiResponse<void>> => {
    return post('/api/v1/dashboard/notifications/read-all');
  },

  // Mark single notification as read
  markNotificationRead: async (notificationId: number): Promise<ApiResponse<void>> => {
    return post(`/api/v1/dashboard/notifications/${notificationId}/read-at`);
  },

  // Get notification statistics
  getNotificationStats: async (): Promise<ApiResponse<{ notification_count: number; new_order_count: number }>> => {
    return get('/api/v1/dashboard/user/profile/notifications-statistic');
  },

  // Get notification settings
  getNotificationSettings: async (): Promise<ApiResponse<NotificationSettings>> => {
    return get('/api/v1/dashboard/user/notifications');
  },

  // Update notification settings
  updateNotificationSettings: async (settings: NotificationSettings): Promise<ApiResponse<void>> => {
    return post('/api/v1/dashboard/user/update/notifications', settings);
  },

  // Update FCM token
  updateFcmToken: async (token: string): Promise<ApiResponse<void>> => {
    return post('/api/v1/dashboard/user/profile/firebase/token/update', { firebase_token: token });
  },

  // ===== Phone Verification =====

  // Send verification OTP
  sendPhoneVerification: async (phone: string): Promise<ApiResponse<{ verifyId: string }>> => {
    return post('/api/v1/dashboard/user/profile/verify-phone', { phone });
  },

  // Verify OTP
  verifyPhoneOtp: async (verifyId: string, otp: string): Promise<ApiResponse<void>> => {
    return post('/api/v1/dashboard/user/profile/verify-otp-phone', { verifyId, otp });
  },

  // ===== Referral =====

  // Get referral info
  getReferralInfo: async (): Promise<ApiResponse<Referral>> => {
    return get('/api/v1/rest/referral');
  },

  // ===== Become Seller =====

  // Create shop
  createShop: async (data: FormData): Promise<ApiResponse<void>> => {
    return postFormData('/api/v1/dashboard/user/shops', data);
  },
};

