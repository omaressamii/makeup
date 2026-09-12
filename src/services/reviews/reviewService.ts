import { ref, get, set, update, push } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { Review, Booking } from '../../types';
import { sendNotification } from '../notifications/notificationService';
import { createAuditLog } from '../admin/adminService';

/**
 * Submit a review for a completed booking
 */
export async function submitReview(params: {
  bookingId: string;
  artistId: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  rating: number; // 1-5
  comment: string;
  serviceName?: string;
}): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    // 1. Verify booking exists, is completed, and belongs to client
    const bookingSnap = await get(ref(rtdb, `bookings/${params.bookingId}`));
    if (!bookingSnap.exists()) {
      return { success: false, error: 'Booking does not exist.' };
    }

    const booking = bookingSnap.val() as Booking;
    if (booking.clientId !== params.clientId) {
      return { success: false, error: 'You are not authorized to review this booking.' };
    }
    if (booking.status !== 'completed') {
      return { success: false, error: 'Reviews are only allowed after a booking is completed.' };
    }
    if (booking.hasReview) {
      return { success: false, error: 'A review has already been submitted for this booking.' };
    }

    const reviewRef = push(ref(rtdb, 'reviews'));
    const reviewId = reviewRef.key!;

    const newReview: Review = {
      reviewId,
      bookingId: params.bookingId,
      artistId: params.artistId,
      clientId: params.clientId,
      clientName: params.clientName,
      clientPhoto: params.clientPhoto || '',
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: params.comment.trim(),
      serviceName: params.serviceName || booking.serviceName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isHidden: false
    };

    // Multi-path write
    const updates: Record<string, any> = {
      [`reviews/${reviewId}`]: newReview,
      [`reviewsByArtist/${params.artistId}/${reviewId}`]: true,
      [`bookings/${params.bookingId}/hasReview`]: true
    };

    await update(ref(rtdb), updates);

    // Recompute artist rating & reviewCount
    await recalculateArtistRating(params.artistId);

    // Notify artist
    await sendNotification({
      userId: params.artistId,
      type: 'new_review',
      title: 'New Review Received!',
      message: `${params.clientName} gave you a ${params.rating}-star review for ${booking.serviceName}.`,
      link: `/artist?tab=reviews`
    });

    // Audit log
    await createAuditLog({
      actorId: params.clientId,
      actorName: params.clientName,
      actorRole: 'client',
      action: 'REVIEW_SUBMITTED',
      targetId: reviewId,
      targetType: 'review',
      metadata: { artistId: params.artistId, rating: params.rating }
    });

    return { success: true, review: newReview };
  } catch (err: any) {
    console.error('Error submitting review:', err);
    return { success: false, error: err.message || 'Failed to submit review' };
  }
}

/**
 * Recalculate and update an artist's average rating and reviewCount in RTDB
 */
export async function recalculateArtistRating(artistId: string): Promise<void> {
  try {
    const reviewsSnap = await get(ref(rtdb, 'reviews'));
    if (!reviewsSnap.exists()) return;

    const all: Review[] = Object.values(reviewsSnap.val());
    const artistReviews = all.filter(r => r.artistId === artistId && !r.isHidden);

    const validCount = artistReviews.length;
    let totalScore = 0;
    artistReviews.forEach(r => { totalScore += r.rating; });

    const newAvg = validCount > 0 ? Number((totalScore / validCount).toFixed(1)) : 5.0;

    await update(ref(rtdb, `artists/${artistId}`), {
      rating: newAvg,
      reviewCount: validCount,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.error('Error recalculating artist rating:', err);
  }
}

/**
 * Fetch reviews for an artist
 */
export async function getArtistReviews(artistId: string): Promise<Review[]> {
  try {
    const snap = await get(ref(rtdb, 'reviews'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as Review[];
    return all
      .filter(r => r.artistId === artistId && !r.isHidden)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching artist reviews:', err);
    return [];
  }
}

/**
 * Fetch all reviews (Admin)
 */
export async function getAllReviews(): Promise<Review[]> {
  try {
    const snap = await get(ref(rtdb, 'reviews'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as Review[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    return [];
  }
}

/**
 * Toggle hide/show review (Admin moderation)
 */
export async function toggleReviewVisibility(reviewId: string, isHidden: boolean, adminUser: { id: string; name: string }): Promise<void> {
  await update(ref(rtdb, `reviews/${reviewId}`), {
    isHidden,
    updatedAt: Date.now()
  });

  const reviewSnap = await get(ref(rtdb, `reviews/${reviewId}`));
  if (reviewSnap.exists()) {
    const r = reviewSnap.val() as Review;
    await recalculateArtistRating(r.artistId);
  }

  await createAuditLog({
    actorId: adminUser.id,
    actorName: adminUser.name,
    actorRole: 'admin',
    action: isHidden ? 'REVIEW_HIDDEN' : 'REVIEW_RESTORED',
    targetId: reviewId,
    targetType: 'review',
    metadata: { isHidden }
  });
}
