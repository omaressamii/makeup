import { ref, get, set, update, push, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { AppNotification } from '../../types';

/**
 * Send an in-app notification to a user
 */
export async function sendNotification(params: {
  userId: string;
  type: AppNotification['type'];
  title: string;
  message: string;
  link?: string;
}): Promise<AppNotification> {
  const notifRef = push(ref(rtdb, `notifications/${params.userId}`));
  const notificationId = notifRef.key!;

  const notification: AppNotification = {
    notificationId,
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    isRead: false,
    createdAt: Date.now()
  };

  await set(notifRef, notification);
  return notification;
}

/**
 * Fetch all notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const snap = await get(ref(rtdb, `notifications/${userId}`));
    if (!snap.exists()) return [];
    const notifs: AppNotification[] = Object.values(snap.val());
    return notifs.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  await update(ref(rtdb, `notifications/${userId}/${notificationId}`), {
    isRead: true
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const snap = await get(ref(rtdb, `notifications/${userId}`));
    if (!snap.exists()) return;
    const updates: Record<string, any> = {};
    Object.keys(snap.val()).forEach(id => {
      updates[`notifications/${userId}/${id}/isRead`] = true;
    });
    await update(ref(rtdb), updates);
  } catch (err) {
    console.error('Error marking all notifications read:', err);
  }
}

/**
 * Real-time listener for user notifications
 */
export function subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
  const notifRef = ref(rtdb, `notifications/${userId}`);
  return onValue(notifRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
    } else {
      const all: AppNotification[] = Object.values(snapshot.val());
      callback(all.sort((a, b) => b.createdAt - a.createdAt));
    }
  });
}
