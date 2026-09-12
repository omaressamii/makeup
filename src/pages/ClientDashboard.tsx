import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Heart,
  MessageSquare,
  User,
  Star,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Booking, MakeupArtist } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getClientBookings, updateBookingStatus } from '../services/bookings/bookingService';
import { getClientFavoriteArtists, toggleFavorite } from '../services/favorites/favoriteService';
import { updateUserProfile } from '../services/auth/authService';
import { ChatView } from '../components/messaging/ChatView';
import { ReviewModal } from '../components/booking/ReviewModal';

interface ClientDashboardProps {
  initialTab?: 'bookings' | 'favorites' | 'messages' | 'profile';
  initialConvId?: string;
  onNavigate: (view: string, extra?: any) => void;
}

const statusArabicMap: Record<string, string> = {
  all: 'الكل',
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  initialTab = 'bookings',
  initialConvId,
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites' | 'messages' | 'profile'>(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<MakeupArtist[]>([]);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

  // Cancel prompt
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Profile form
  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const [bList, fList] = await Promise.all([
        getClientBookings(currentUser.uid),
        getClientFavoriteArtists(currentUser.uid)
      ]);
      setBookings(bList);
      setFavorites(fList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking || !currentUser) return;
    setCancelling(true);
    try {
      await updateBookingStatus(
        cancelModalBooking.bookingId,
        'cancelled',
        { id: currentUser.uid, name: currentUser.displayName, role: 'client' },
        cancellationReason || 'ألغيت بواسطة العميلة'
      );
      setCancelModalBooking(null);
      setCancellationReason('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await updateUserProfile(currentUser.uid, {
        displayName: name,
        phone,
        city
      });
      setProfileMsg('تم حفظ بيانات الحساب بنجاح!');
    } catch (err: any) {
      setProfileMsg('حدث خطأ في تحديث البيانات: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveFavorite = async (artistId: string) => {
    if (!currentUser?.uid) return;
    await toggleFavorite(currentUser.uid, artistId);
    setFavorites(prev => prev.filter(a => a.artistId !== artistId));
  };

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right" dir="rtl">
      
      {/* Client Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={currentUser?.displayName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-200 shadow-xs"
          />
          <div>
            <h1 className="text-2xl font-bold font-serif-display text-stone-900">
              أهلاً بيكي، {currentUser?.displayName}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              حساب عميلة • {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-4 sm:gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto justify-around">
          <div className="text-center">
            <span className="text-xl sm:text-2xl font-bold font-serif-display text-stone-900 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-stone-500 font-semibold">حجوزات سارية</span>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div className="text-center">
            <span className="text-xl sm:text-2xl font-bold font-serif-display text-stone-900 block">
              {favorites.length}
            </span>
            <span className="text-[11px] text-stone-500 font-semibold">في المفضلة</span>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div className="text-center">
            <span className="text-xl sm:text-2xl font-bold font-serif-display text-stone-900 block">
              {completedCount}
            </span>
            <span className="text-[11px] text-stone-500 font-semibold">حجوزات تمت</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-8">
        <button
          id="client-tab-bookings"
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          حجوزاتي ({bookings.length})
        </button>

        <button
          id="client-tab-favorites"
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          الآرتستس المفضلة ({favorites.length})
        </button>

        <button
          id="client-tab-messages"
          onClick={() => setActiveTab('messages')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'messages'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-sky-600" />
          الرسائل والمحادثات
        </button>

        <button
          id="client-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <User className="w-4 h-4 text-stone-500" />
          إعدادات الحساب
        </button>
      </div>

      {/* Tab Content 1: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setBookingFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  bookingFilter === st
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {statusArabicMap[st] || st}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200 space-y-3">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
              <p>مفيش حجوزات في القسم ده حالياً.</p>
              <button
                onClick={() => onNavigate('discover')}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-colors"
              >
                استكشفي الآرتستس واحجزي الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredBookings.map((b) => (
                <div
                  key={b.bookingId}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-stone-300 transition-all text-right"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.artistImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={b.artistName}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                      />
                      <div>
                        <h4 className="font-bold font-serif-display text-sm text-stone-900">
                          {b.serviceName}
                        </h4>
                        <p className="text-xs text-stone-500">
                          الميك أب آرتست: <span className="font-bold text-stone-800">{b.artistName}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : b.status === 'completed'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {statusArabicMap[b.status] || b.status}
                    </span>
                  </div>

                  {/* Date & Time details */}
                  <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        تاريخ الميعاد:
                      </span>
                      <span className="font-bold">{b.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        ساعة الحجز:
                      </span>
                      <span className="font-bold">{b.startTime} إلى {b.endTime} ({b.duration} دقيقة)</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-900 font-bold pt-1 border-t border-stone-200">
                      <span>إجمالي المبلغ التقديري:</span>
                      <span className="font-serif-display text-amber-900 text-sm">{b.price} ج.م</span>
                    </div>
                  </div>

                  {b.notes && (
                    <p className="text-[11px] text-stone-500 italic bg-stone-50/50 p-2 rounded-lg">
                      "{b.notes}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('artist-profile', { artistId: b.artistId })}
                      className="text-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1"
                    >
                      <span>بروفايل الآرتست</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Cancel option */}
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                        >
                          إلغاء الميعاد
                        </button>
                      )}

                      {/* Review option */}
                      {b.status === 'completed' && !b.hasReview && (
                        <button
                          onClick={() => setSelectedBookingForReview(b)}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-white" />
                          تقييم التجربة
                        </button>
                      )}

                      {b.status === 'completed' && b.hasReview && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تم التقييم بنجاح
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          {favorites.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200 space-y-3">
              <Heart className="w-10 h-10 text-stone-300 mx-auto" />
              <p>لسه محفظتيش أي ميك أب آرتست في المفضلة عندك.</p>
              <button
                onClick={() => onNavigate('discover')}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-colors"
              >
                تصفحي أفضل الآرتستس
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((artist) => (
                <div
                  key={artist.artistId}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-right"
                >
                  <div className="relative h-44 bg-stone-100">
                    <img
                      src={artist.coverImage || artist.profileImage}
                      alt={artist.fullName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveFavorite(artist.artistId)}
                      className="absolute top-3 left-3 p-2 rounded-full bg-black/50 text-rose-400 hover:text-white backdrop-blur-xs"
                      title="إزالة من المفضلة"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold font-serif-display text-sm text-stone-900">
                        {artist.fullName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs font-semibold text-stone-800" dir="ltr">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{artist.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500">
                      {artist.location} • يبدأ من {artist.startingPrice || 1800} ج.م
                    </p>
                  </div>

                  <div className="p-4 pt-2 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => onNavigate('artist-profile', { artistId: artist.artistId })}
                      className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      عرض البروفايل والحجز
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Messages */}
      {activeTab === 'messages' && (
        <div>
          <ChatView initialConversationId={initialConvId} />
        </div>
      )}

      {/* Tab Content 4: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5 text-right">
          <h3 className="text-base font-bold font-serif-display text-stone-900">
            بيانات الحساب والتواصل
          </h3>

          {profileMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">البريد الإلكتروني (المعرف الأساسي)</label>
              <input
                type="text"
                disabled
                value={currentUser?.email || ''}
                className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed text-left font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">رقم الموبايل (لتأكيد المواعيد وإشعارات الواتساب)</label>
              <input
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-left font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">المدينة أو المنطقة المفضلة</label>
              <input
                type="text"
                placeholder="مثال: القاهرة، التجمع الخامس"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-right"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {profileSaving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedBookingForReview(null)}
          booking={selectedBookingForReview}
          onReviewSubmitted={() => {
            setSelectedBookingForReview(null);
            loadData();
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-right">
            <h3 className="text-sm font-bold text-stone-900">إلغاء ميعاد الحجز؟</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              هل أنتي متأكدة من رغبتك في إلغاء حجزك لـ <strong>{cancelModalBooking.serviceName}</strong> مع الميك أب آرتست {cancelModalBooking.artistName} يوم {cancelModalBooking.date}؟
            </p>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">سبب الإلغاء (اختياري)</label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="مثال: تم تأجيل موعد المناسبة..."
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-right"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2 text-xs font-semibold border border-stone-200 rounded-xl hover:bg-stone-50"
              >
                الاحتفاظ بالحجز
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
              >
                {cancelling ? 'جارِ الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
