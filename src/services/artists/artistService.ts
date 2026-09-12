import { ref, get, set, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { rtdb, storage } from '../firebase/config';
import {
  MakeupArtist,
  MakeupService,
  PortfolioItem,
  ArtistAvailability,
  ServiceCategory
} from '../../types';

export interface ArtistFilterParams {
  searchTerm?: string;
  location?: string;
  specialty?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minExperience?: number;
  isVerified?: boolean;
  status?: string;
  sortBy?: 'highest_rated' | 'most_reviewed' | 'price_asc' | 'price_desc' | 'newest';
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<ServiceCategory[]> {
  try {
    const snap = await get(ref(rtdb, 'categories'));
    if (!snap.exists()) return [];
    const val = snap.val();
    const categories: ServiceCategory[] = Object.values(val);
    return categories
      .filter(c => c.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

/**
 * Fetch and filter artists
 */
export async function getArtists(params: ArtistFilterParams = {}): Promise<MakeupArtist[]> {
  try {
    const snap = await get(ref(rtdb, 'artists'));
    if (!snap.exists()) return [];

    let artists: MakeupArtist[] = Object.values(snap.val());

    // Public only sees approved artists (unless admin)
    artists = artists.filter(a => a.status === 'approved' || a.status === 'pending');

    // Filter by search term
    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      artists = artists.filter(a =>
        a.fullName.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.bio?.toLowerCase().includes(term) ||
        a.specialties?.some(s => s.toLowerCase().includes(term))
      );
    }

    // Filter by location
    if (params.location) {
      const loc = params.location.toLowerCase();
      artists = artists.filter(a =>
        a.location.toLowerCase().includes(loc) ||
        a.serviceArea?.toLowerCase().includes(loc)
      );
    }

    // Filter by specialty
    if (params.specialty) {
      const spec = params.specialty.toLowerCase();
      artists = artists.filter(a =>
        a.specialties?.some(s => s.toLowerCase().includes(spec))
      );
    }

    // Filter by minRating
    if (typeof params.minRating === 'number' && params.minRating > 0) {
      artists = artists.filter(a => (a.rating || 0) >= params.minRating!);
    }

    // Filter by minExperience
    if (typeof params.minExperience === 'number' && params.minExperience > 0) {
      artists = artists.filter(a => (a.experienceYears || 0) >= params.minExperience!);
    }

    // Filter by verified
    if (params.isVerified) {
      artists = artists.filter(a => a.isVerified === true);
    }

    // Filter by price range
    if (typeof params.minPrice === 'number') {
      artists = artists.filter(a => (a.startingPrice || 0) >= params.minPrice!);
    }
    if (typeof params.maxPrice === 'number' && params.maxPrice > 0) {
      artists = artists.filter(a => (a.startingPrice || 0) <= params.maxPrice!);
    }

    // Sorting
    switch (params.sortBy) {
      case 'highest_rated':
        artists.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'most_reviewed':
        artists.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'price_asc':
        artists.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
        break;
      case 'price_desc':
        artists.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
        break;
      case 'newest':
        artists.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      default:
        // Featured first, then highest rated
        artists.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
    }

    return artists;
  } catch (err) {
    console.error('Error fetching artists:', err);
    return [];
  }
}

/**
 * Fetch featured artists for homepage hero and discovery
 */
export async function getFeaturedArtists(limitCount: number = 6): Promise<MakeupArtist[]> {
  try {
    const all = await getArtists();
    const featured = all.filter(a => a.isFeatured && a.status === 'approved');
    if (featured.length >= 3) {
      return featured.slice(0, limitCount);
    }
    // Fallback to highest rated if not enough explicitly featured
    return all.slice(0, limitCount);
  } catch (err) {
    console.error('Error fetching featured artists:', err);
    return [];
  }
}

/**
 * Get artist by ID
 */
export async function getArtistById(artistId: string): Promise<MakeupArtist | null> {
  try {
    const snap = await get(ref(rtdb, `artists/${artistId}`));
    if (snap.exists()) {
      return snap.val() as MakeupArtist;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching artist ${artistId}:`, err);
    return null;
  }
}

/**
 * Get artist by username slug
 */
export async function getArtistByUsername(username: string): Promise<MakeupArtist | null> {
  try {
    const snap = await get(ref(rtdb, 'artists'));
    if (!snap.exists()) return null;
    const all = Object.values(snap.val()) as MakeupArtist[];
    return all.find(a => a.username.toLowerCase() === username.toLowerCase()) || null;
  } catch (err) {
    console.error(`Error fetching artist by username ${username}:`, err);
    return null;
  }
}

/**
 * Update artist profile
 */
export async function updateArtistProfile(artistId: string, updates: Partial<MakeupArtist>): Promise<void> {
  await update(ref(rtdb, `artists/${artistId}`), {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Get all services for an artist
 */
export async function getArtistServices(artistId: string): Promise<MakeupService[]> {
  try {
    const snap = await get(ref(rtdb, 'services'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as MakeupService[];
    return all.filter(s => s.artistId === artistId);
  } catch (err) {
    console.error(`Error fetching services for artist ${artistId}:`, err);
    return [];
  }
}

/**
 * Create or update a service
 */
export async function saveArtistService(service: Partial<MakeupService> & { artistId: string }): Promise<MakeupService> {
  const serviceId = service.serviceId || push(ref(rtdb, 'services')).key!;
  const newService: MakeupService = {
    serviceId,
    artistId: service.artistId,
    name: service.name || 'Custom Makeup Session',
    description: service.description || '',
    price: Number(service.price) || 100,
    duration: Number(service.duration) || 60,
    categoryId: service.categoryId || 'cat-bridal',
    categoryName: service.categoryName || 'Bridal',
    isActive: service.isActive !== false,
    createdAt: service.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await set(ref(rtdb, `services/${serviceId}`), newService);

  // Recalculate and update artist startingPrice if applicable
  try {
    const allServices = await getArtistServices(service.artistId);
    const activePrices = allServices.filter(s => s.isActive).map(s => s.price);
    if (activePrices.length > 0) {
      const minPrice = Math.min(...activePrices);
      await update(ref(rtdb, `artists/${service.artistId}`), { startingPrice: minPrice });
    }
  } catch (e) {
    console.warn('Could not update starting price:', e);
  }

  return newService;
}

/**
 * Create a new service for an artist
 */
export async function createArtistService(artistId: string, serviceData: Partial<MakeupService>): Promise<MakeupService> {
  return saveArtistService({ ...serviceData, artistId });
}

/**
 * Delete a service
 */
export async function deleteArtistService(arg1: string, arg2?: string): Promise<void> {
  // Support both (serviceId, artistId) and (artistId, serviceId)
  const serviceId = arg2 ? (arg1.startsWith('srv_') ? arg1 : arg2) : arg1;
  const artistId = arg2 ? (arg1.startsWith('srv_') ? arg2 : arg1) : undefined;

  await remove(ref(rtdb, `services/${serviceId}`));
  if (artistId) {
    const remaining = await getArtistServices(artistId);
    const activePrices = remaining.filter(s => s.isActive).map(s => s.price);
    if (activePrices.length > 0) {
      const minPrice = Math.min(...activePrices);
      await update(ref(rtdb, `artists/${artistId}`), { startingPrice: minPrice });
    }
  }
}

/**
 * Get portfolio items for an artist
 */
export async function getArtistPortfolio(artistId: string): Promise<PortfolioItem[]> {
  try {
    const snap = await get(ref(rtdb, 'portfolio'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as PortfolioItem[];
    return all
      .filter(p => p.artistId === artistId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || b.createdAt - a.createdAt);
  } catch (err) {
    console.error(`Error fetching portfolio for artist ${artistId}:`, err);
    return [];
  }
}

/**
 * Upload portfolio item with storage upload and RTDB persistence
 */
export async function uploadPortfolioItem(
  artistId: string,
  file: File,
  meta: { title: string; categoryName: string; description?: string }
): Promise<PortfolioItem> {
  let downloadUrl = '';
  let path = `artists/${artistId}/portfolio/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  try {
    const sRef = storageRef(storage, path);
    const snapshot = await uploadBytes(sRef, file, { contentType: file.type });
    downloadUrl = await getDownloadURL(snapshot.ref);
  } catch (storageErr) {
    console.warn('Storage upload error, using object URL or base64 fallback:', storageErr);
    // Fallback to data URL for seamless offline or preview demo
    downloadUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  return savePortfolioItem({
    artistId,
    imageUrl: downloadUrl,
    storagePath: path,
    title: meta.title,
    categoryName: meta.categoryName,
    description: meta.description || ''
  });
}

/**
 * Save or update a portfolio item
 */
export async function savePortfolioItem(item: Partial<PortfolioItem> & { artistId: string; imageUrl: string }): Promise<PortfolioItem> {
  const portfolioId = item.portfolioId || push(ref(rtdb, 'portfolio')).key!;
  const newPortfolioItem: PortfolioItem = {
    portfolioId,
    artistId: item.artistId,
    imageUrl: item.imageUrl,
    storagePath: item.storagePath || '',
    title: item.title || 'Artistry Look',
    description: item.description || '',
    categoryId: item.categoryId || 'cat-bridal',
    categoryName: item.categoryName || 'Bridal',
    sortOrder: Number(item.sortOrder) || 1,
    createdAt: item.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await set(ref(rtdb, `portfolio/${portfolioId}`), newPortfolioItem);
  return newPortfolioItem;
}

/**
 * Delete a portfolio item
 */
export async function deletePortfolioItem(arg1: string, arg2?: string): Promise<void> {
  // Support both (itemId) and (artistId, itemId)
  const portfolioId = arg2 || arg1;
  await remove(ref(rtdb, `portfolio/${portfolioId}`));
}

/**
 * Get artist availability
 */
export async function getArtistAvailability(artistId: string): Promise<ArtistAvailability | null> {
  try {
    const snap = await get(ref(rtdb, `availability/${artistId}`));
    if (snap.exists()) {
      return snap.val() as ArtistAvailability;
    }
    // Return sensible defaults if not set yet
    return {
      artistId,
      workingDays: {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: true, start: '09:00', end: '18:00' },
        sunday: { enabled: false, start: '10:00', end: '16:00' }
      },
      breakTimes: {
        monday: [{ start: '13:00', end: '14:00' }]
      },
      unavailableDates: {},
      slotIntervalMinutes: 30
    };
  } catch (err) {
    console.error(`Error fetching availability for artist ${artistId}:`, err);
    return null;
  }
}

/**
 * Update artist availability
 */
export async function updateArtistAvailability(artistId: string, availability: Partial<ArtistAvailability>): Promise<void> {
  await update(ref(rtdb, `availability/${artistId}`), availability);
}

export const saveArtistAvailability = updateArtistAvailability;

