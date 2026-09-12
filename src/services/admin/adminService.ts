import { ref, get, set, update, remove, push } from 'firebase/database';
import { rtdb } from '../firebase/config';
import {
  UserProfile,
  MakeupArtist,
  Booking,
  Review,
  UserReport,
  AuditLog,
  ServiceCategory,
  UserRole,
  UserPermissions
} from '../../types';
import { sendNotification } from '../notifications/notificationService';
import { resetPassword } from '../auth/authService';

/**
 * Record an audit log entry
 */
export async function createAuditLog(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
}): Promise<AuditLog> {
  try {
    const logRef = push(ref(rtdb, 'auditLogs'));
    const logId = logRef.key!;

    const entry: AuditLog = {
      logId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      targetId: params.targetId,
      targetType: params.targetType,
      timestamp: Date.now(),
      metadata: params.metadata || {}
    };

    await set(logRef, entry);
    return entry;
  } catch (err) {
    console.warn('Audit log write error:', err);
    return {
      logId: 'fallback',
      ...params,
      timestamp: Date.now()
    };
  }
}

/**
 * Fetch all audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await get(ref(rtdb, 'auditLogs'));
    if (!snap.exists()) return [];
    const all: AuditLog[] = Object.values(snap.val());
    return all.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

/**
 * Fetch all platform users
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await get(ref(rtdb, 'users'));
    if (!snap.exists()) return [];
    const all: UserProfile[] = Object.values(snap.val());
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

/**
 * Toggle user active/suspended state
 */
export async function toggleUserStatus(
  userId: string,
  newStatus: 'active' | 'suspended',
  admin: { id: string; name: string }
): Promise<void> {
  await update(ref(rtdb, `users/${userId}`), {
    status: newStatus,
    updatedAt: Date.now()
  });

  // If user is also an artist, reflect in artists table
  const artistSnap = await get(ref(rtdb, `artists/${userId}`));
  if (artistSnap.exists()) {
    await update(ref(rtdb, `artists/${userId}`), {
      status: newStatus === 'suspended' ? 'suspended' : 'approved',
      updatedAt: Date.now()
    });
  }

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    targetId: userId,
    targetType: 'user',
    metadata: { newStatus }
  });
}

/**
 * Approve or reject artist application
 */
export async function reviewArtistApplication(
  artistId: string,
  status: 'approved' | 'rejected' | 'suspended',
  admin: { id: string; name: string },
  adminNotes?: string
): Promise<void> {
  await update(ref(rtdb, `artists/${artistId}`), {
    status,
    isVerified: status === 'approved',
    updatedAt: Date.now()
  });

  // Notify the artist
  let title = '';
  let msg = '';
  if (status === 'approved') {
    title = 'Artist Application Approved!';
    msg = 'Congratulations! Your profile is now approved and verified. You can now receive client bookings and inquiries.';
  } else if (status === 'rejected') {
    title = 'Artist Application Update';
    msg = `Your artist application was not approved at this time.${adminNotes ? ` Note: ${adminNotes}` : ''}`;
  } else {
    title = 'Artist Profile Suspended';
    msg = 'Your artist profile has been temporarily suspended by administrative review.';
  }

  await sendNotification({
    userId: artistId,
    type: status === 'approved' ? 'artist_approved' : 'artist_rejected',
    title,
    message: msg,
    link: `/artist`
  });

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: `ARTIST_STATUS_${status.toUpperCase()}`,
    targetId: artistId,
    targetType: 'artist',
    metadata: { status, adminNotes }
  });
}

/**
 * Toggle artist verified & featured status
 */
export async function toggleArtistBadges(
  artistId: string,
  updates: { isVerified?: boolean; isFeatured?: boolean },
  admin: { id: string; name: string }
): Promise<void> {
  await update(ref(rtdb, `artists/${artistId}`), {
    ...updates,
    updatedAt: Date.now()
  });

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'ARTIST_BADGES_UPDATED',
    targetId: artistId,
    targetType: 'artist',
    metadata: updates
  });
}

/**
 * Create a content or user report
 */
export async function createReport(params: {
  reporterId: string;
  reporterName?: string;
  targetId: string;
  targetType: 'artist' | 'review' | 'user';
  targetTitle?: string;
  reason: string;
}): Promise<UserReport> {
  const reportRef = push(ref(rtdb, 'reports'));
  const reportId = reportRef.key!;

  const report: UserReport = {
    reportId,
    reporterId: params.reporterId,
    reporterName: params.reporterName || 'Anonymous',
    targetId: params.targetId,
    targetType: params.targetType,
    targetTitle: params.targetTitle || '',
    reason: params.reason,
    status: 'pending',
    createdAt: Date.now()
  };

  await set(reportRef, report);

  await createAuditLog({
    actorId: params.reporterId,
    actorName: params.reporterName || 'Client',
    actorRole: 'client',
    action: 'REPORT_SUBMITTED',
    targetId: reportId,
    targetType: 'report',
    metadata: { targetType: params.targetType, targetId: params.targetId, reason: params.reason }
  });

  return report;
}

/**
 * Get all reports
 */
export async function getReports(): Promise<UserReport[]> {
  try {
    const snap = await get(ref(rtdb, 'reports'));
    if (!snap.exists()) return [];
    const all: UserReport[] = Object.values(snap.val());
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching reports:', err);
    return [];
  }
}

/**
 * Resolve or dismiss a report
 */
export async function updateReportStatus(
  reportId: string,
  status: 'resolved' | 'dismissed',
  adminNotes: string,
  admin: { id: string; name: string }
): Promise<void> {
  await update(ref(rtdb, `reports/${reportId}`), {
    status,
    adminNotes,
    resolvedAt: Date.now()
  });

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: `REPORT_${status.toUpperCase()}`,
    targetId: reportId,
    targetType: 'report',
    metadata: { status, adminNotes }
  });
}

/**
 * Save or update category
 */
export async function saveCategory(category: Partial<ServiceCategory>): Promise<ServiceCategory> {
  const id = category.id || `cat-${Date.now()}`;
  const newCat: ServiceCategory = {
    id,
    name: category.name || 'Category',
    description: category.description || '',
    slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || id,
    sortOrder: category.sortOrder || 1,
    isActive: category.isActive !== false
  };

  await set(ref(rtdb, `categories/${id}`), newCat);
  return newCat;
}

/**
 * Delete category
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  await remove(ref(rtdb, `categories/${categoryId}`));
}

/**
 * Calculate complete marketplace statistics
 */
export async function getAdminStatistics() {
  const [usersSnap, artistsSnap, bookingsSnap, reviewsSnap, reportsSnap] = await Promise.all([
    get(ref(rtdb, 'users')),
    get(ref(rtdb, 'artists')),
    get(ref(rtdb, 'bookings')),
    get(ref(rtdb, 'reviews')),
    get(ref(rtdb, 'reports'))
  ]);

  const users: UserProfile[] = usersSnap.exists() ? Object.values(usersSnap.val()) : [];
  const artists: MakeupArtist[] = artistsSnap.exists() ? Object.values(artistsSnap.val()) : [];
  const bookings: Booking[] = bookingsSnap.exists() ? Object.values(bookingsSnap.val()) : [];
  const reviews: Review[] = reviewsSnap.exists() ? Object.values(reviewsSnap.val()) : [];
  const reports: UserReport[] = reportsSnap.exists() ? Object.values(reportsSnap.val()) : [];

  const totalClients = users.filter(u => u.role === 'client').length;
  const totalArtists = artists.length;
  const pendingArtists = artists.filter(a => a.status === 'pending').length;

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const totalReviews = reviews.filter(r => !r.isHidden).length;
  const avgRating = totalReviews > 0
    ? Number((reviews.filter(r => !r.isHidden).reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 5.0;

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  return {
    totalUsers: users.length,
    totalClients,
    totalArtists,
    pendingArtists,
    totalBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    confirmedBookings,
    totalRevenue,
    totalReviews,
    avgRating,
    pendingReports,
    recentBookings: bookings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    topArtists: artists.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 4)
  };
}

export interface AdminUserUpdatePayload {
  displayName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  phone?: string;
  city?: string;
  notes?: string;
  newPassword?: string;
  permissions?: UserPermissions;
}

/**
 * Update user information, role, and custom permissions as Admin
 */
export async function updateUserAndPermissions(
  userId: string,
  payload: AdminUserUpdatePayload,
  admin: { id: string; name: string }
): Promise<void> {
  const updates: Record<string, any> = {
    displayName: payload.displayName.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    status: payload.status,
    phone: (payload.phone || '').trim(),
    city: (payload.city || '').trim(),
    notes: (payload.notes || '').trim(),
    permissions: payload.permissions || {
      canBook: true,
      canMessage: true,
      canReview: true,
      canManageServices: payload.role === 'artist',
      canManagePortfolio: payload.role === 'artist',
      isAdmin: payload.role === 'admin'
    },
    updatedAt: Date.now()
  };

  // If a new password is provided, set it in RTDB
  let passwordWasUpdated = false;
  if (payload.newPassword && payload.newPassword.trim().length >= 6) {
    updates.customPassword = payload.newPassword.trim();
    updates.passwordUpdatedAt = Date.now();
    passwordWasUpdated = true;
  }

  // 1. Update user profile in users/
  await update(ref(rtdb, `users/${userId}`), updates);

  // 2. If user is an artist or promoted to artist, sync/create artists/ node
  if (payload.role === 'artist') {
    const artistSnap = await get(ref(rtdb, `artists/${userId}`));
    if (artistSnap.exists()) {
      await update(ref(rtdb, `artists/${userId}`), {
        fullName: payload.displayName.trim(),
        phone: (payload.phone || '').trim(),
        location: payload.city || 'القاهرة',
        status: payload.status === 'suspended' ? 'suspended' : 'approved',
        updatedAt: Date.now()
      });
    } else {
      const usernameSlug = payload.displayName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/(^-|-$)/g, '') || `artist-${userId.slice(0, 6)}`;

      await set(ref(rtdb, `artists/${userId}`), {
        artistId: userId,
        userId: userId,
        fullName: payload.displayName.trim(),
        username: usernameSlug,
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
        coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        bio: 'ميك أب آرتست معتمدة ومسجلة على المنصة.',
        experienceYears: 3,
        location: payload.city || 'القاهرة',
        serviceArea: `${payload.city || 'القاهرة'} والمناطق المجاورة`,
        phone: (payload.phone || '').trim(),
        specialties: ['عرايس وزفاف', 'سواريه وفول جلام'],
        rating: 5.0,
        reviewCount: 0,
        isVerified: true,
        status: payload.status === 'suspended' ? 'suspended' : 'approved',
        startingPrice: 1500,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }

  // 3. If client or updated
  const clientSnap = await get(ref(rtdb, `clients/${userId}`));
  if (clientSnap.exists()) {
    await update(ref(rtdb, `clients/${userId}`), {
      fullName: payload.displayName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: (payload.phone || '').trim(),
      location: payload.city || '',
      updatedAt: Date.now()
    });
  } else if (payload.role === 'client') {
    await set(ref(rtdb, `clients/${userId}`), {
      clientId: userId,
      userId: userId,
      fullName: payload.displayName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: (payload.phone || '').trim(),
      location: payload.city || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  // 4. Create Audit Log
  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'USER_EDITED_BY_ADMIN',
    targetId: userId,
    targetType: 'user',
    metadata: {
      displayName: payload.displayName,
      newRole: payload.role,
      newStatus: payload.status,
      permissions: payload.permissions,
      passwordChanged: passwordWasUpdated
    }
  });

  if (passwordWasUpdated) {
    try {
      await sendNotification({
        userId,
        title: 'تحديث كلمة المرور',
        message: 'تم تحديث كلمة المرور الخاصة بحسابك من قبل إدارة المنصة بنجاح.',
        type: 'system'
      });
    } catch {}
  }
}

/**
 * Change a user's password directly as Admin
 */
export async function changeUserPasswordByAdmin(
  userId: string,
  newPassword: string,
  admin: { id: string; name: string }
): Promise<void> {
  const trimmed = newPassword.trim();
  if (trimmed.length < 6) {
    throw new Error('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام.');
  }

  await update(ref(rtdb, `users/${userId}`), {
    customPassword: trimmed,
    passwordUpdatedAt: Date.now(),
    updatedAt: Date.now()
  });

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'USER_PASSWORD_CHANGED_BY_ADMIN',
    targetId: userId,
    targetType: 'user',
    metadata: {
      timestamp: Date.now()
    }
  });

  try {
    await sendNotification({
      userId,
      title: 'تحديث كلمة المرور',
      message: 'قام مدير المنصة بتعيين كلمة مرور جديدة لحسابك.',
      type: 'system'
    });
  } catch {}
}

/**
 * Send password reset email to a user from Admin panel
 */
export async function sendResetPasswordEmailByAdmin(
  email: string,
  userId: string,
  admin: { id: string; name: string }
): Promise<void> {
  await resetPassword(email);

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'PASSWORD_RESET_EMAIL_TRIGGERED',
    targetId: userId,
    targetType: 'user',
    metadata: {
      targetEmail: email
    }
  });
}

/**
 * Delete a user from platform
 */
export async function deleteUserByAdmin(
  userId: string,
  admin: { id: string; name: string }
): Promise<void> {
  await remove(ref(rtdb, `users/${userId}`));
  await remove(ref(rtdb, `artists/${userId}`));
  await remove(ref(rtdb, `clients/${userId}`));

  await createAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'USER_DELETED_BY_ADMIN',
    targetId: userId,
    targetType: 'user'
  });
}

