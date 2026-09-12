import { ref, get, set, update, push, runTransaction } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { Booking, BookingStatus } from '../../types';
import { getArtistAvailability } from '../artists/artistService';
import { sendNotification } from '../notifications/notificationService';
import { createAuditLog } from '../admin/adminService';

// Helper: parse time "HH:MM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: minutes to "HH:MM"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface AvailableSlot {
  startTime: string; // "10:00"
  endTime: string;   // "11:30"
  isAvailable: boolean;
  reason?: string;
}

/**
 * Calculate available time slots for an artist on a given date and service duration
 */
export async function getAvailableTimeSlots(
  artistId: string,
  dateStr: string, // "YYYY-MM-DD"
  durationMinutes: number
): Promise<AvailableSlot[]> {
  try {
    const availability = await getArtistAvailability(artistId);
    if (!availability) return [];

    // Check if whole date is marked unavailable
    if (availability.unavailableDates && availability.unavailableDates[dateStr]) {
      return [];
    }

    // Determine day of the week
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[dateObj.getDay()];
    const dayConfig = availability.workingDays[dayName];

    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    const startWorkMins = timeToMinutes(dayConfig.start);
    const endWorkMins = timeToMinutes(dayConfig.end);
    const intervalMins = availability.slotIntervalMinutes || 30;

    // Fetch existing bookings for this artist on this date
    const bookingsSnap = await get(ref(rtdb, 'bookings'));
    const existingBookings: Booking[] = [];
    if (bookingsSnap.exists()) {
      const allBookings: Booking[] = Object.values(bookingsSnap.val());
      existingBookings.push(
        ...allBookings.filter(
          b =>
            b.artistId === artistId &&
            b.date === dateStr &&
            b.status !== 'cancelled' &&
            b.status !== 'rejected'
        )
      );
    }

    // Get break times for today
    const dayBreaks = availability.breakTimes?.[dayName] || [];

    const slots: AvailableSlot[] = [];

    for (let cur = startWorkMins; cur + durationMinutes <= endWorkMins; cur += intervalMins) {
      const slotStart = cur;
      const slotEnd = cur + durationMinutes;
      const startStr = minutesToTime(slotStart);
      const endStr = minutesToTime(slotEnd);

      // Check collision with break times
      let collidesWithBreak = false;
      for (const brk of dayBreaks) {
        const brkStart = timeToMinutes(brk.start);
        const brkEnd = timeToMinutes(brk.end);
        if (Math.max(slotStart, brkStart) < Math.min(slotEnd, brkEnd)) {
          collidesWithBreak = true;
          break;
        }
      }

      // Check collision with existing bookings
      let collidesWithBooking = false;
      for (const b of existingBookings) {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        if (Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd)) {
          collidesWithBooking = true;
          break;
        }
      }

      const isAvailable = !collidesWithBreak && !collidesWithBooking;
      slots.push({
        startTime: startStr,
        endTime: endStr,
        isAvailable,
        reason: collidesWithBooking ? 'Booked' : collidesWithBreak ? 'Artist Break' : undefined
      });
    }

    return slots;
  } catch (err) {
    console.error('Error computing available time slots:', err);
    return [];
  }
}

/**
 * Create a new booking with conflict validation
 */
export async function createBooking(params: {
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
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const { artistId, date, startTime, endTime } = params;

    // 1. Conflict verification against existing bookings
    const bookingsSnap = await get(ref(rtdb, 'bookings'));
    if (bookingsSnap.exists()) {
      const all: Booking[] = Object.values(bookingsSnap.val());
      const newStartMins = timeToMinutes(startTime);
      const newEndMins = timeToMinutes(endTime);

      const conflict = all.find(b => {
        if (b.artistId !== artistId || b.date !== date) return false;
        if (b.status === 'cancelled' || b.status === 'rejected') return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return Math.max(newStartMins, bStart) < Math.min(newEndMins, bEnd);
      });

      if (conflict) {
        return {
          success: false,
          error: `This time slot was just taken. Please pick another available time.`
        };
      }
    }

    const bookingRef = push(ref(rtdb, 'bookings'));
    const bookingId = bookingRef.key!;

    const newBooking: Booking = {
      bookingId,
      artistId: params.artistId,
      artistName: params.artistName,
      artistImage: params.artistImage || '',
      clientId: params.clientId,
      clientName: params.clientName,
      clientEmail: params.clientEmail || '',
      clientPhone: params.clientPhone || '',
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      price: params.price,
      duration: params.duration,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status: 'pending',
      notes: params.notes || '',
      hasReview: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Atomic multi-path write
    const updates: Record<string, any> = {
      [`bookings/${bookingId}`]: newBooking,
      [`bookingsByArtist/${params.artistId}/${bookingId}`]: true,
      [`bookingsByClient/${params.clientId}/${bookingId}`]: true
    };

    await update(ref(rtdb), updates);

    // Send real-time notification to the artist
    await sendNotification({
      userId: params.artistId,
      type: 'booking_request',
      title: 'New Booking Request!',
      message: `${params.clientName} requested an appointment for ${params.serviceName} on ${params.date} at ${params.startTime}.`,
      link: `/artist?tab=bookings`
    });

    // Write audit log
    await createAuditLog({
      actorId: params.clientId,
      actorName: params.clientName,
      actorRole: 'client',
      action: 'BOOKING_CREATED',
      targetId: bookingId,
      targetType: 'booking',
      metadata: {
        artistId: params.artistId,
        serviceName: params.serviceName,
        date: params.date,
        price: params.price
      }
    });

    return { success: true, booking: newBooking };
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return { success: false, error: err.message || 'Failed to submit booking' };
  }
}

/**
 * Update status of an existing booking
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  actor: { id: string; name: string; role: string },
  cancellationReason?: string
): Promise<void> {
  const bookingSnap = await get(ref(rtdb, `bookings/${bookingId}`));
  if (!bookingSnap.exists()) {
    throw new Error('Booking not found');
  }

  const booking = bookingSnap.val() as Booking;
  const updates: Record<string, any> = {
    status: newStatus,
    updatedAt: Date.now()
  };

  if (cancellationReason) {
    updates.cancellationReason = cancellationReason;
  }

  await update(ref(rtdb, `bookings/${bookingId}`), updates);

  // Send contextual notification
  let notifUserId = booking.clientId;
  let notifTitle = '';
  let notifMsg = '';

  if (newStatus === 'confirmed') {
    notifTitle = 'Booking Accepted!';
    notifMsg = `Great news! ${booking.artistName} has confirmed your appointment for ${booking.serviceName} on ${booking.date}.`;
  } else if (newStatus === 'rejected') {
    notifTitle = 'Booking Declined';
    notifMsg = `${booking.artistName} was unable to accept the booking for ${booking.serviceName} on ${booking.date}.`;
  } else if (newStatus === 'cancelled') {
    // If client cancelled, notify artist; if artist cancelled, notify client
    if (actor.role === 'client') {
      notifUserId = booking.artistId;
      notifTitle = 'Booking Cancelled by Client';
      notifMsg = `${booking.clientName} cancelled their booking for ${booking.serviceName} on ${booking.date}.`;
    } else {
      notifTitle = 'Booking Cancelled';
      notifMsg = `Your booking for ${booking.serviceName} on ${booking.date} was cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`;
    }
  } else if (newStatus === 'completed') {
    notifTitle = 'Appointment Completed!';
    notifMsg = `Your session with ${booking.artistName} is marked complete. Click to rate and share your review!`;
  }

  if (notifTitle) {
    await sendNotification({
      userId: notifUserId,
      type: `booking_${newStatus}` as any,
      title: notifTitle,
      message: notifMsg,
      link: actor.role === 'artist' ? `/client?tab=bookings` : `/artist?tab=bookings`
    });
  }

  // Audit log
  await createAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `BOOKING_${newStatus.toUpperCase()}`,
    targetId: bookingId,
    targetType: 'booking',
    metadata: {
      previousStatus: booking.status,
      newStatus,
      cancellationReason
    }
  });
}

/**
 * Fetch bookings for a client
 */
export async function getClientBookings(clientId: string): Promise<Booking[]> {
  try {
    const snap = await get(ref(rtdb, 'bookings'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as Booking[];
    return all
      .filter(b => b.clientId === clientId)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching client bookings:', err);
    return [];
  }
}

/**
 * Fetch bookings for an artist
 */
export async function getArtistBookings(artistId: string): Promise<Booking[]> {
  try {
    const snap = await get(ref(rtdb, 'bookings'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as Booking[];
    return all
      .filter(b => b.artistId === artistId)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching artist bookings:', err);
    return [];
  }
}

/**
 * Fetch all bookings (Admin)
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const snap = await get(ref(rtdb, 'bookings'));
    if (!snap.exists()) return [];
    const all = Object.values(snap.val()) as Booking[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    return [];
  }
}
