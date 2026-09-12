export type UserRole = 'admin' | 'artist' | 'client';

export type ArtistStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface UserPermissions {
  canBook?: boolean;
  canMessage?: boolean;
  canReview?: boolean;
  canManageServices?: boolean;
  canManagePortfolio?: boolean;
  isAdmin?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  status: 'active' | 'suspended';
  permissions?: UserPermissions;
  notes?: string;
  customPassword?: string;
  passwordUpdatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MakeupArtist {
  artistId: string;
  userId: string;
  fullName: string;
  username: string;
  profileImage: string;
  coverImage?: string;
  bio: string;
  experienceYears: number;
  location: string;
  serviceArea: string;
  phone: string;
  email?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured?: boolean;
  status: ArtistStatus;
  startingPrice: number;
  instagram?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    website?: string;
    tiktok?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ClientProfile {
  clientId: string;
  userId: string;
  fullName: string;
  email?: string;
  phone: string;
  profileImage?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MakeupService {
  serviceId: string;
  artistId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  categoryId: string;
  categoryName?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PortfolioItem {
  portfolioId: string;
  artistId: string;
  imageUrl: string;
  storagePath?: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface ArtistAvailability {
  artistId: string;
  workingDays: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  breakTimes?: {
    [day: string]: Array<{ start: string; end: string }>;
  };
  unavailableDates?: {
    [dateIso: string]: boolean | string; // e.g. "2026-09-25": true
  };
  slotIntervalMinutes?: number; // default 30 or 60
}

export type Availability = ArtistAvailability;

export interface Booking {
  bookingId: string;
  artistId: string;
  artistName: string;
  artistImage?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "15:30"
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
  hasReview?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Review {
  reviewId: string;
  bookingId: string;
  artistId: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  rating: number; // 1 - 5
  comment: string;
  serviceName?: string;
  createdAt: number;
  updatedAt: number;
  isHidden?: boolean;
}

export interface Conversation {
  id: string;
  participants: {
    [uid: string]: boolean;
  };
  participantDetails: {
    [uid: string]: {
      name: string;
      photo?: string;
      role: UserRole;
    };
  };
  lastMessage: string;
  lastSenderId: string;
  lastMessageTime: number;
  updatedAt: number;
  unreadCount?: {
    [uid: string]: number;
  };
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  type:
    | 'booking_request'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'booking_cancelled'
    | 'booking_completed'
    | 'new_review'
    | 'new_message'
    | 'artist_approved'
    | 'artist_rejected'
    | 'announcement'
    | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: number;
}

export interface UserReport {
  reportId: string;
  reporterId: string;
  reporterName?: string;
  targetId: string;
  targetType: 'artist' | 'review' | 'user';
  targetTitle?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetId: string;
  targetType: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PlatformSettings {
  platformFeePercent: number;
  minBookingAdvanceHours: number;
  featuredArtistIds: string[];
  systemNotice?: string;
}
