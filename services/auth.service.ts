import { get, post } from './api';
import { ApiResponse, LoginResponse, RegisterResponse, User } from '@/types';

interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

interface RegisterData {
  email?: string;
  phone?: string;
  firstname: string;
  lastname?: string;
  password: string;
  password_confirmation: string;
}

interface VerifyData {
  verifyId: string;
  verifyCode: string;
}

interface ResetPasswordData {
  email?: string;
  phone?: string;
}

interface ConfirmResetData {
  verifyId: string;
  verifyCode: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  // Login with email/phone and password
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return post('/api/v1/auth/login', credentials);
  },

  // Login with Google
  googleLogin: async (token: string): Promise<ApiResponse<LoginResponse>> => {
    return post('/api/v1/auth/google/callback', { token });
  },

  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
    return post('/api/v1/auth/register', data);
  },

  // Verify email
  verifyEmail: async (verifyCode: string): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return get(`/api/v1/auth/verify/${verifyCode}`);
  },

  // Verify phone
  verifyPhone: async (data: VerifyData): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return post('/api/v1/auth/verify/phone', data);
  },

  // Complete registration after verification
  completeRegistration: async (data: { verifyId: string }): Promise<ApiResponse<LoginResponse>> => {
    return post('/api/v1/auth/after-verify', data);
  },

  // Forgot password - email
  forgotPasswordEmail: async (email: string): Promise<ApiResponse<RegisterResponse>> => {
    return post('/api/v1/auth/forgot/email-password', { email });
  },

  // Forgot password - phone
  forgotPasswordPhone: async (phone: string): Promise<ApiResponse<RegisterResponse>> => {
    return post('/api/v1/auth/forgot/password', { phone });
  },

  // Confirm password reset - email
  confirmResetEmail: async (verifyCode: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return post(`/api/v1/auth/forgot/email-password/${verifyCode}`, { password });
  },

  // Confirm password reset - phone
  confirmResetPhone: async (data: ConfirmResetData): Promise<ApiResponse<LoginResponse>> => {
    return post('/api/v1/auth/forgot/password/confirm', data);
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return get('/api/v1/dashboard/user/profile/show');
  },

  // Logout
  logout: async (): Promise<void> => {
    await post('/api/v1/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

