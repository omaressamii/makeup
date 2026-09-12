/**
 * Cloud Functions for Makeup Artist Marketplace
 * Production triggers for Firebase Realtime Database
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

/**
 * Triggered when a new booking is created
 * Notifies artist & creates audit log
 */
exports.onBookingCreated = functions.database
  .ref("/bookings/{bookingId}")
  .onCreate(async (snapshot, context) => {
    const booking = snapshot.val();
    if (!booking) return null;

    const { bookingId } = context.params;
    const { artistId, clientId, serviceName, date, startTime } = booking;

    // 1. Send in-app notification to the artist
    const notificationRef = db.ref(`/notifications/${artistId}`).push();
    await notificationRef.set({
      notificationId: notificationRef.key,
      userId: artistId,
      type: "booking_request",
      title: "New Booking Request",
      message: `You received a new booking request for ${serviceName} on ${date} at ${startTime}.`,
      link: `/artist?tab=bookings&bookingId=${bookingId}`,
      isRead: false,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });

    // 2. Index booking under bookingsByArtist and bookingsByClient
    const updates = {};
    updates[`/bookingsByArtist/${artistId}/${bookingId}`] = true;
    updates[`/bookingsByClient/${clientId}/${bookingId}`] = true;

    // 3. Create audit log
    const auditRef = db.ref("/auditLogs").push();
    updates[`/auditLogs/${auditRef.key}`] = {
      logId: auditRef.key,
      actorId: clientId,
      actorName: booking.clientName || "Client",
      actorRole: "client",
      action: "BOOKING_CREATED",
      targetId: bookingId,
      targetType: "booking",
      timestamp: admin.database.ServerValue.TIMESTAMP,
      metadata: { serviceName, date, startTime, price: booking.price }
    };

    return db.ref().update(updates);
  });

/**
 * Triggered when booking status changes (accepted, rejected, cancelled, completed)
 */
exports.onBookingStatusChanged = functions.database
  .ref("/bookings/{bookingId}/status")
  .onUpdate(async (change, context) => {
    const oldStatus = change.before.val();
    const newStatus = change.after.val();
    const { bookingId } = context.params;

    if (oldStatus === newStatus) return null;

    const bookingSnap = await db.ref(`/bookings/${bookingId}`).once("value");
    const booking = bookingSnap.val();
    if (!booking) return null;

    const { clientId, artistId, serviceName, date } = booking;

    let notifTitle = "";
    let notifMsg = "";
    let targetUserId = clientId;

    switch (newStatus) {
      case "confirmed":
        notifTitle = "Booking Confirmed!";
        notifMsg = `Your booking for ${serviceName} on ${date} has been accepted by the artist.`;
        break;
      case "rejected":
        notifTitle = "Booking Declined";
        notifMsg = `The artist could not accept your booking for ${serviceName} on ${date}.`;
        break;
      case "cancelled":
        notifTitle = "Booking Cancelled";
        notifMsg = `The booking for ${serviceName} on ${date} was cancelled.`;
        break;
      case "completed":
        notifTitle = "Appointment Completed - Leave a Review!";
        notifMsg = `Your appointment for ${serviceName} is marked complete. Please share your rating and experience!`;
        break;
      default:
        return null;
    }

    const notifRef = db.ref(`/notifications/${targetUserId}`).push();
    await notifRef.set({
      notificationId: notifRef.key,
      userId: targetUserId,
      type: `booking_${newStatus}`,
      title: notifTitle,
      message: notifMsg,
      link: `/client?tab=bookings&bookingId=${bookingId}`,
      isRead: false,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });

    // Write audit log
    const auditRef = db.ref("/auditLogs").push();
    return auditRef.set({
      logId: auditRef.key,
      actorId: artistId,
      actorName: booking.artistName || "System",
      actorRole: "artist",
      action: `BOOKING_STATUS_${newStatus.toUpperCase()}`,
      targetId: bookingId,
      targetType: "booking",
      timestamp: admin.database.ServerValue.TIMESTAMP,
      metadata: { previousStatus: oldStatus, newStatus }
    });
  });

/**
 * Triggered when a new review is submitted
 * Recomputes artist's average rating and total review count
 */
exports.onReviewCreated = functions.database
  .ref("/reviews/{reviewId}")
  .onCreate(async (snapshot, context) => {
    const review = snapshot.val();
    if (!review) return null;

    const { artistId, rating, clientName } = review;
    const { reviewId } = context.params;

    // 1. Denormalize to reviewsByArtist
    await db.ref(`/reviewsByArtist/${artistId}/${reviewId}`).set(true);

    // 2. Fetch all reviews for this artist to recompute
    const reviewsIndexSnap = await db.ref(`/reviewsByArtist/${artistId}`).once("value");
    const reviewIds = reviewsIndexSnap.val() ? Object.keys(reviewsIndexSnap.val()) : [reviewId];

    let totalScore = 0;
    let validCount = 0;

    for (const id of reviewIds) {
      const rSnap = await db.ref(`/reviews/${id}`).once("value");
      const r = rSnap.val();
      if (r && !r.isHidden && typeof r.rating === "number") {
        totalScore += r.rating;
        validCount++;
      }
    }

    const newAvg = validCount > 0 ? Number((totalScore / validCount).toFixed(1)) : 5.0;

    await db.ref(`/artists/${artistId}`).update({
      rating: newAvg,
      reviewCount: validCount,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    // 3. Notify the artist
    const notifRef = db.ref(`/notifications/${artistId}`).push();
    return notifRef.set({
      notificationId: notifRef.key,
      userId: artistId,
      type: "new_review",
      title: "New Review Received",
      message: `${clientName || "A client"} gave you a ${rating}-star rating!`,
      link: `/artist?tab=reviews`,
      isRead: false,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });
  });
