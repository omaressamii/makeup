import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const env = (import.meta as any).env || {};

/**
 * Resolves a guaranteed valid Firebase Realtime Database URL.
 * Guards against malformed, placeholder (e.g. "x"), or empty environment variables.
 */
function resolveDatabaseURL(): string {
  const custom = env.VITE_FIREBASE_DATABASE_URL;
  if (
    typeof custom === 'string' &&
    custom.trim().startsWith('https://') &&
    custom.includes('.firebaseio.com')
  ) {
    return custom.trim();
  }
  return "https://makeup-artist-2d609-default-rtdb.firebaseio.com";
}

export const firebaseConfig = {
  apiKey: (typeof env.VITE_FIREBASE_API_KEY === 'string' && env.VITE_FIREBASE_API_KEY.length > 10)
    ? env.VITE_FIREBASE_API_KEY
    : "AIzaSyD9DV-jDQw-0s-zuwHWmpqQW2W-zEPrAXE",
  authDomain: (typeof env.VITE_FIREBASE_AUTH_DOMAIN === 'string' && env.VITE_FIREBASE_AUTH_DOMAIN.includes('.'))
    ? env.VITE_FIREBASE_AUTH_DOMAIN
    : "makeup-artist-2d609.firebaseapp.com",
  projectId: (typeof env.VITE_FIREBASE_PROJECT_ID === 'string' && env.VITE_FIREBASE_PROJECT_ID.length > 3)
    ? env.VITE_FIREBASE_PROJECT_ID
    : "makeup-artist-2d609",
  storageBucket: (typeof env.VITE_FIREBASE_STORAGE_BUCKET === 'string' && env.VITE_FIREBASE_STORAGE_BUCKET.includes('.'))
    ? env.VITE_FIREBASE_STORAGE_BUCKET
    : "makeup-artist-2d609.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "564081230654",
  appId: "1:564081230654:web:b78dbade6be20a5b4aa26f",
  databaseURL: resolveDatabaseURL()
};

// Initialize Firebase singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const rtdb = getDatabase(app, resolveDatabaseURL());
export const storage = getStorage(app);
