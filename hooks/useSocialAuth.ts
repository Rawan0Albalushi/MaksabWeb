'use client';

import { useState, useCallback } from 'react';
import { signInWithGoogle, signInWithApple, signOutFromFirebase, isFirebaseReady } from '@/lib/firebase';
import { authService } from '@/services';
import { useAuthStore } from '@/store';

export type SocialProvider = 'google' | 'apple';

interface SocialAuthResult {
  success: boolean;
  error?: string;
}

interface UseSocialAuthReturn {
  signInWithProvider: (provider: SocialProvider) => Promise<SocialAuthResult>;
  isLoading: boolean;
  error: string | null;
}

export const useSocialAuth = (): UseSocialAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const signInWithProvider = useCallback(async (provider: SocialProvider): Promise<SocialAuthResult> => {
    setIsLoading(true);
    setError(null);

    // Check if Firebase is configured
    if (!isFirebaseReady()) {
      const errorMessage = 'Social sign-in is not configured. Please contact support.';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Firebase is not configured. Set up .env.local with Firebase credentials.');
      return { success: false, error: errorMessage };
    }

    try {
      // Step 1: Sign in with Firebase
      let userCredential;
      
      if (provider === 'google') {
        userCredential = await signInWithGoogle();
      } else {
        userCredential = await signInWithApple();
      }

      const firebaseUser = userCredential.user;
      
      // Extract user info from Firebase
      const email = firebaseUser.email;
      const displayName = firebaseUser.displayName;
      const photoURL = firebaseUser.photoURL;
      const uid = firebaseUser.uid;

      // Validate required fields
      if (!email) {
        throw new Error('Email not provided by the authentication provider');
      }

      // Step 2: Call backend API with user info
      // Backend uses the same endpoint for both Google and Apple
      const response = await authService.socialLogin({
        email: email,
        name: displayName || email.split('@')[0], // Fallback to email prefix if no name
        id: uid, // Firebase UID as the social provider ID
        avatar: photoURL || undefined,
      });

      if (response.status && response.data) {
        // Handle different token formats from API
        const token = response.data.token || (response.data as any).access_token;
        const user = response.data.user;

        if (!token) {
          throw new Error('No token received from server');
        }

        // Step 3: Store auth data
        login(user, token);

        // Step 4: Sign out from Firebase (we only need it for authentication)
        // The backend manages our session with its own token
        await signOutFromFirebase();

        return { success: true };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (err: unknown) {
      console.error(`${provider} sign-in error:`, err);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err && typeof err === 'object') {
        const error = err as { 
          code?: string; 
          message?: string; 
          response?: { data?: { message?: string } } 
        };
        
        // Firebase-specific error codes
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Popup was blocked. Please allow popups for this site.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Sign-in cancelled';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'This sign-in method is not enabled.';
        } else if (error.response?.data?.message) {
          // Backend API error
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  return {
    signInWithProvider,
    isLoading,
    error,
  };
};
