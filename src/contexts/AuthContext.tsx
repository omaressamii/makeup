import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, rtdb } from '../services/firebase/config';
import { UserProfile, UserRole } from '../types';
import { registerUser, loginUser, logoutUser, resetPassword, getUserProfile } from '../services/auth/authService';
import { seedMarketplaceDatabase, INITIAL_USERS } from '../services/firebase/seedData';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-seed database if categories or artists are not yet in RTDB
  useEffect(() => {
    let isMounted = true;
    async function checkAndSeed() {
      try {
        const snap = await get(ref(rtdb, 'categories'));
        if (!snap.exists()) {
          await seedMarketplaceDatabase();
        }
      } catch (e) {
        console.warn('Initial RTDB check warning:', e);
      }
    }
    checkAndSeed();
    return () => { isMounted = false; };
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
          } else {
            // fallback
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'User',
              role: 'client',
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        // If not logged in via Firebase Auth, check if custom session exists
        const checkCustom = localStorage.getItem('glow_custom_session');
        if (checkCustom) {
          try {
            const parsed = JSON.parse(checkCustom) as UserProfile;
            if (parsed && parsed.uid) {
              setCurrentUser(parsed);
              setIsLoading(false);
              return;
            }
          } catch {}
        }

        // If not logged in via real auth or custom session, default to demo client if in mock/preview mode or null
        const storedDemo = localStorage.getItem('glow_demo_role');
        if (storedDemo && ['admin', 'artist', 'client'].includes(storedDemo)) {
          const demoTarget = storedDemo as UserRole;
          const userEntry = Object.values(INITIAL_USERS).find(u => u.role === demoTarget);
          if (userEntry) {
            setCurrentUser(userEntry);
          } else {
            setCurrentUser(null);
          }
        } else {
          // Default guest
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('glow_demo_role');
      const profile = await loginUser(email, pass);
      setCurrentUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, fullName: string, role: UserRole) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('glow_demo_role');
      const profile = await registerUser(email, pass, fullName, role);
      setCurrentUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    localStorage.removeItem('glow_demo_role');
    localStorage.removeItem('glow_custom_session');
    try {
      await logoutUser();
      setCurrentUser(null);
      setFirebaseUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await resetPassword(email);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('glow_custom_session');
      localStorage.setItem('glow_demo_role', targetRole);
      const userEntry = Object.values(INITIAL_USERS).find(u => u.role === targetRole);
      if (userEntry) {
        // fetch fresh from RTDB if possible
        const snap = await get(ref(rtdb, `users/${userEntry.uid}`));
        if (snap.exists()) {
          setCurrentUser(snap.val() as UserProfile);
        } else {
          setCurrentUser(userEntry);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (currentUser?.uid) {
      const p = await getUserProfile(currentUser.uid);
      if (p) setCurrentUser(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        role: currentUser?.role || 'client',
        isLoading,
        login,
        register,
        logout,
        sendPasswordReset,
        switchDemoRole,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
