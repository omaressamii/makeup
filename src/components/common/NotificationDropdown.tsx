import React, { useEffect, useState } from 'react';
import { Bell, Check, Calendar, MessageSquare, Star, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification } from '../../types';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notifications/notificationService';

interface NotificationDropdownProps {
  onNavigate?: (link: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      return;
    }
    const unsubscribe = subscribeToNotifications(currentUser.uid, (list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (currentUser?.uid && !notif.isRead) {
      await markNotificationAsRead(currentUser.uid, notif.notificationId);
    }
    setIsOpen(false);
    if (notif.link && onNavigate) {
      onNavigate(notif.link);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.uid) {
      await markAllNotificationsAsRead(currentUser.uid);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking_request':
      case 'booking_accepted':
      case 'booking_completed':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      case 'new_review':
        return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case 'artist_approved':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-600 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 left-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-stone-900">الإشعارات</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-rose-100 text-rose-700 rounded-full">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="py-8 px-4 text-center text-stone-400 text-sm">
                  مفيش إشعارات جديدة حالياً، كل حاجة تمام! ✨
                </div>
              ) : (
                notifications.slice(0, 15).map((notif) => (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-stone-50 transition-colors cursor-pointer flex gap-3 items-start ${
                      !notif.isRead ? 'bg-amber-50/40 font-medium' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white border border-stone-200 shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs ${!notif.isRead ? 'text-stone-900 font-bold' : 'text-stone-700'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}
