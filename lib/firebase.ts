import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  Auth,
  UserCredential
} from 'firebase/auth';

// Firebase configuration - these values should come from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is valid (all required fields present)
const isFirebaseConfigValid = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase lazily (prevent reinitializing on hot reload)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let appleProvider: OAuthProvider | null = null;

const initializeFirebase = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (!isFirebaseConfigValid()) {
    console.warn(
      'Firebase config is incomplete. Please set up your .env.local file with Firebase credentials.\n' +
      'See .env.example for required variables.'
    );
    return false;
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    
    // Initialize providers
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');

    appleProvider = new OAuthProvider('apple.com');
    appleProvider.addScope('email');
    appleProvider.addScope('name');
  }
  
  return true;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  if (!initializeFirebase() || !auth || !googleProvider) {
    throw new Error(
      'Firebase is not configured. Please set up your .env.local file with Firebase credentials.'
    );
  }
  return signInWithPopup(auth, googleProvider);
};

// Sign in with Apple
export const signInWithApple = async (): Promise<UserCredential> => {
  if (!initializeFirebase() || !auth || !appleProvider) {
    throw new Error(
      'Firebase is not configured. Please set up your .env.local file with Firebase credentials.'
    );
  }
  return signInWithPopup(auth, appleProvider);
};

// Sign out from Firebase
export const signOutFromFirebase = async (): Promise<void> => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

// Check if Firebase is properly configured
export const isFirebaseReady = (): boolean => {
  return isFirebaseConfigValid();
};

// Export for use in other parts of the app
export { auth, app };
