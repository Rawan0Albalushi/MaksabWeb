import { get, post } from './api';
import { ApiResponse, LoginResponse, SendCodeResponse, User } from '@/types';

interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

// Data for completing registration after email verification
interface CompleteRegistrationData {
  firstname: string;
  lastname?: string;
  email: string;
  phone: string;
  password: string;
  password_conformation: string; // Note: API uses 'conformation' not 'confirmation'
  referral?: string;
}

// Data for completing registration after phone verification
interface CompletePhoneRegistrationData {
  verifyId: string;
  firstname: string;
  lastname?: string;
  email?: string;
  phone: string;
  password: string;
  password_conformation: string;
  referral?: string;
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

// Helper function to clean phone/email (remove + sign)
const cleanInput = (value: string): string => {
  return value.replace(/\+/g, '');
};

export const authService = {
  // Login with email/phone and password
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const cleanedCredentials = {
      ...credentials,
      email: credentials.email ? cleanInput(credentials.email) : undefined,
      phone: credentials.phone ? cleanInput(credentials.phone) : undefined,
    };
    return post('/api/v1/auth/login', cleanedCredentials);
  },

  // ==================== EMAIL REGISTRATION FLOW ====================
  
  // Step 1: Send verification code to email
  sendEmailVerificationCode: async (email: string): Promise<ApiResponse<SendCodeResponse>> => {
    const cleanedEmail = cleanInput(email);
    return post(`/api/v1/auth/register?email=${encodeURIComponent(cleanedEmail)}`);
  },

  // Step 2: Verify email code
  verifyEmailCode: async (verifyCode: string): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return get(`/api/v1/auth/verify/${verifyCode}`);
  },

  // Step 3: Complete registration after email verification
  completeEmailRegistration: async (data: CompleteRegistrationData): Promise<ApiResponse<LoginResponse>> => {
    const cleanedData = {
      ...data,
      email: cleanInput(data.email),
      phone: cleanInput(data.phone),
    };
    return post('/api/v1/auth/after-verify', cleanedData);
  },

  // ==================== PHONE REGISTRATION FLOW ====================
  
  // Step 1: Send OTP to phone
  sendPhoneOTP: async (phone: string): Promise<ApiResponse<SendCodeResponse>> => {
    const cleanedPhone = cleanInput(phone);
    return post('/api/v1/auth/register', { phone: cleanedPhone });
  },

  // Step 2: Verify phone OTP
  verifyPhoneOTP: async (verifyId: string, verifyCode: string): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return post(`/api/v1/auth/verify/phone?verifyId=${verifyId}&verifyCode=${verifyCode}`);
  },

  // Step 3: Complete registration after phone verification
  completePhoneRegistration: async (data: CompletePhoneRegistrationData): Promise<ApiResponse<LoginResponse>> => {
    const cleanedData = {
      ...data,
      phone: cleanInput(data.phone),
      email: data.email ? cleanInput(data.email) : undefined,
    };
    return post('/api/v1/auth/verify/phone', cleanedData);
  },

  // ==================== SOCIAL LOGIN ====================
  
  // Google/Apple login callback
  socialLogin: async (params: {
    email: string;
    name: string;
    id: string; // Firebase ID
    avatar?: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const queryParams = new URLSearchParams({
      email: cleanInput(params.email),
      name: params.name,
      id: params.id,
      ...(params.avatar && { avatar: params.avatar }),
    });
    return post(`/api/v1/auth/google/callback?${queryParams.toString()}`);
  },

  // ==================== FORGOT PASSWORD ====================
  
  // Forgot password - email
  forgotPasswordEmail: async (email: string): Promise<ApiResponse<SendCodeResponse>> => {
    return post('/api/v1/auth/forgot/email-password', { email: cleanInput(email) });
  },

  // Forgot password - phone
  forgotPasswordPhone: async (phone: string): Promise<ApiResponse<SendCodeResponse>> => {
    return post('/api/v1/auth/forgot/password', { phone: cleanInput(phone) });
  },

  // Confirm password reset - email
  confirmResetEmail: async (verifyCode: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return post(`/api/v1/auth/forgot/email-password/${verifyCode}`, { password });
  },

  // Confirm password reset - phone
  confirmResetPhone: async (data: ConfirmResetData): Promise<ApiResponse<LoginResponse>> => {
    return post('/api/v1/auth/forgot/password/confirm', data);
  },

  // ==================== USER PROFILE ====================
  
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

