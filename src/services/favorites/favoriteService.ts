import { ref, get, set, remove, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { MakeupArtist } from '../../types';
import { getArtists } from '../artists/artistService';

/**
 * Toggle favorite status
 */
export async function toggleFavorite(clientId: string, artistId: string): Promise<boolean> {
  const favRef = ref(rtdb, `favorites/${clientId}/${artistId}`);
  const snap = await get(favRef);
  if (snap.exists() && snap.val() === true) {
    await remove(favRef);
    return false;
  } else {
    await set(favRef, true);
    return true;
  }
}

/**
 * Check if an artist is favorited
 */
export async function isArtistFavorited(clientId: string, artistId: string): Promise<boolean> {
  try {
    const snap = await get(ref(rtdb, `favorites/${clientId}/${artistId}`));
    return snap.exists() && snap.val() === true;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch all favorite artist IDs for a client
 */
export async function getClientFavoriteIds(clientId: string): Promise<string[]> {
  try {
    const snap = await get(ref(rtdb, `favorites/${clientId}`));
    if (!snap.exists()) return [];
    return Object.keys(snap.val());
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return [];
  }
}

/**
 * Fetch all favorited MakeupArtist objects for a client
 */
export async function getClientFavoriteArtists(clientId: string): Promise<MakeupArtist[]> {
  const favoriteIds = await getClientFavoriteIds(clientId);
  if (favoriteIds.length === 0) return [];

  const allArtists = await getArtists();
  return allArtists.filter(a => favoriteIds.includes(a.artistId));
}

/**
 * Real-time listener for client favorite IDs
 */
export function subscribeToFavorites(clientId: string, callback: (ids: string[]) => void): () => void {
  const favRef = ref(rtdb, `favorites/${clientId}`);
  return onValue(favRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
    } else {
      callback(Object.keys(snapshot.val()));
    }
  });
}
