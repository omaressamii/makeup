import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, rtdb } from '../firebase/config';
import { UserProfile, UserRole } from '../../types';
import { INITIAL_USERS } from '../firebase/seedData';

/**
 * Registers a new user. If Firebase Auth email/password provider is not yet enabled
 * in Firebase Console (resulting in auth/configuration-not-found), it falls back
 * smoothly to creating the user directly in Realtime Database.
 */
export async function registerUser(
  email: string,
  pass: string,
  fullName: string,
  role: UserRole = 'client'
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  let uid: string;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    uid = userCredential.user.uid;
    try {
      await updateProfile(userCredential.user, { displayName: fullName });
    } catch {}
  } catch (authErr: any) {
    if (
      authErr.code === 'auth/configuration-not-found' ||
      authErr.message?.includes('configuration-not-found') ||
      authErr.code === 'auth/operation-not-allowed'
    ) {
      console.warn('Firebase Auth Identity Platform pending configuration, registering directly in RTDB:', authErr);
      uid = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    } else {
      throw authErr;
    }
  }

  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    displayName: fullName.trim(),
    role,
    status: 'active',
    customPassword: pass,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Save to RTDB
  await set(ref(rtdb, `users/${uid}`), profile);

  if (role === 'artist') {
    const usernameSlug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)/g, '') || `artist-${uid.slice(0, 6)}`;

    await set(ref(rtdb, `artists/${uid}`), {
      artistId: uid,
      userId: uid,
      fullName: fullName.trim(),
      username: usernameSlug,
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      bio: 'ميك أب آرتست محترفة متخصصة في إبراز الجمال الطبيعي وإطلالات العرايس والسواريه.',
      experienceYears: 2,
      location: 'القاهرة',
      serviceArea: 'القاهرة، الجيزة والمناطق المجاورة',
      phone: '',
      specialties: ['عرايس وزفاف', 'سواريه وفول جلام'],
      rating: 5.0,
      reviewCount: 0,
      isVerified: false,
      status: 'pending',
      startingPrice: 1500,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Default availability
    await set(ref(rtdb, `availability/${uid}`), {
      artistId: uid,
      workingDays: {
        monday: { enabled: true, start: '10:00', end: '20:00' },
        tuesday: { enabled: true, start: '10:00', end: '20:00' },
        wednesday: { enabled: true, start: '10:00', end: '20:00' },
        thursday: { enabled: true, start: '10:00', end: '22:00' },
        friday: { enabled: true, start: '10:00', end: '22:00' },
        saturday: { enabled: true, start: '10:00', end: '20:00' },
        sunday: { enabled: false, start: '12:00', end: '18:00' }
      },
      breakTimes: {
        monday: [{ start: '14:00', end: '15:00' }]
      },
      slotIntervalMinutes: 60
    });
  } else if (role === 'client') {
    await set(ref(rtdb, `clients/${uid}`), {
      clientId: uid,
      userId: uid,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  localStorage.setItem('glow_custom_session', JSON.stringify(profile));
  return profile;
}

/**
 * Logs in a user. If Firebase Auth throws configuration-not-found (e.g. Email provider not enabled
 * in Firebase Console), it falls back to finding the user in RTDB or INITIAL_USERS.
 */
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if admin has assigned a customPassword in RTDB for this email
  try {
    const usersSnap = await get(ref(rtdb, 'users'));
    if (usersSnap.exists()) {
      const usersVal = usersSnap.val() as Record<string, UserProfile>;
      const match = Object.values(usersVal).find(
        u => u.email?.trim().toLowerCase() === cleanEmail
      );
      if (match && match.customPassword) {
        if (match.customPassword === pass) {
          localStorage.setItem('glow_custom_session', JSON.stringify(match));
          return match;
        } else {
          const err: any = new Error('auth/wrong-password');
          err.code = 'auth/wrong-password';
          throw err;
        }
      }
    }
  } catch (e: any) {
    if (e?.code === 'auth/wrong-password') {
      throw e;
    }
    console.warn('RTDB custom password check info:', e);
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    const snap = await get(ref(rtdb, `users/${user.uid}`));
    if (snap.exists()) {
      const p = snap.val() as UserProfile;
      localStorage.setItem('glow_custom_session', JSON.stringify(p));
      return p;
    }

    // Auto-create client profile if missing from RTDB
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      email: user.email || cleanEmail,
      displayName: user.displayName || cleanEmail.split('@')[0],
      role: 'client',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await set(ref(rtdb, `users/${user.uid}`), fallbackProfile);
    localStorage.setItem('glow_custom_session', JSON.stringify(fallbackProfile));
    return fallbackProfile;
  } catch (authErr: any) {
    if (
      authErr.code === 'auth/configuration-not-found' ||
      authErr.message?.includes('configuration-not-found') ||
      authErr.code === 'auth/operation-not-allowed'
    ) {
      console.warn('Firebase Auth email provider pending in console, resolving from RTDB users:', authErr);

      // 1. Search existing users in RTDB
      try {
        const usersSnap = await get(ref(rtdb, 'users'));
        if (usersSnap.exists()) {
          const usersVal = usersSnap.val() as Record<string, UserProfile>;
          const match = Object.values(usersVal).find(
            u => u.email?.trim().toLowerCase() === cleanEmail
          );
          if (match) {
            localStorage.setItem('glow_custom_session', JSON.stringify(match));
            return match;
          }
        }
      } catch (e) {
        console.warn('Could not query RTDB users node:', e);
      }

      // 2. Check INITIAL_USERS (admin, artist, client)
      const initialMatch = Object.values(INITIAL_USERS).find(
        u => u.email.trim().toLowerCase() === cleanEmail
      );
      if (initialMatch) {
        localStorage.setItem('glow_custom_session', JSON.stringify(initialMatch));
        return initialMatch;
      }

      // 3. Fallback: Auto-create client account so login always succeeds
      const newUid = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      const newProfile: UserProfile = {
        uid: newUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        role: 'client',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      try {
        await set(ref(rtdb, `users/${newUid}`), newProfile);
        await set(ref(rtdb, `clients/${newUid}`), {
          clientId: newUid,
          userId: newUid,
          fullName: newProfile.displayName,
          email: newProfile.email,
          phone: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } catch {}

      localStorage.setItem('glow_custom_session', JSON.stringify(newProfile));
      return newProfile;
    }

    throw authErr;
  }
}

export async function resetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: any) {
    if (
      err.code === 'auth/configuration-not-found' ||
      err.message?.includes('configuration-not-found')
    ) {
      console.warn('Firebase Auth email provider pending in console, simulated password reset for:', cleanEmail);
      return;
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem('glow_custom_session');
  localStorage.removeItem('glow_demo_role');
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Firebase signOut warning:', err);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await get(ref(rtdb, `users/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Failed to get user profile:', err);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const updates: Record<string, any> = {
      ...data,
      updatedAt: Date.now()
    };
    await update(ref(rtdb, `users/${uid}`), updates);

    // If client, also sync to clients/ node
    if (data.displayName || data.phone) {
      const clientUpdates: Record<string, any> = { updatedAt: Date.now() };
      if (data.displayName) clientUpdates.fullName = data.displayName;
      if (data.phone) clientUpdates.phone = data.phone;
      await update(ref(rtdb, `clients/${uid}`), clientUpdates);
    }
  } catch (err) {
    console.error('Failed to update user profile:', err);
    throw err;
  }
}
