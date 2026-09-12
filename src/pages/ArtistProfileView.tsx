import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Instagram,
  Globe,
  Share2,
  Tag
} from 'lucide-react';
import { MakeupArtist, MakeupService, PortfolioItem, Review, Availability } from '../types';
import {
  getArtistById,
  getArtistServices,
  getArtistPortfolio,
  getArtistAvailability
} from '../services/artists/artistService';
import { getArtistReviews } from '../services/reviews/reviewService';
import { isArtistFavorited, toggleFavorite } from '../services/favorites/favoriteService';
import { getOrCreateConversation } from '../services/messages/messagingService';
import { useAuth } from '../contexts/AuthContext';
import { BookingModal } from '../components/booking/BookingModal';
import { LightboxModal } from '../components/common/LightboxModal';
import { ReportModal } from '../components/booking/ReportModal';

interface ArtistProfileViewProps {
  artistId: string;
  onNavigate: (view: string, extra?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const arabicDays: Record<string, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة'
};

export const ArtistProfileView: React.FC<ArtistProfileViewProps> = ({
  artistId,
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();

  const [artist, setArtist] = useState<MakeupArtist | null>(null);
  const [services, setServices] = useState<MakeupService[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'services' | 'schedule' | 'reviews'>('portfolio');
  const [selectedPortfolioCategory, setSelectedPortfolioCategory] = useState<string>('all');
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadArtistData = async () => {
      setLoading(true);
      try {
        const [aData, sData, pData, rData, avData] = await Promise.all([
          getArtistById(artistId),
          getArtistServices(artistId),
          getArtistPortfolio(artistId),
          getArtistReviews(artistId),
          getArtistAvailability(artistId)
        ]);

        setArtist(aData);
        setServices(sData);
        setPortfolio(pData);
        setReviews(rData);
        setAvailability(avData);

        if (currentUser?.uid) {
          const fav = await isArtistFavorited(currentUser.uid, artistId);
          setIsFavorited(fav);
        }
      } catch (err) {
        console.error('Error loading artist profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArtistData();
  }, [artistId, currentUser?.uid]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    const newStatus = await toggleFavorite(currentUser.uid, artistId);
    setIsFavorited(newStatus);
  };

  const handleStartConversation = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (!artist) return;

    try {
      const conv = await getOrCreateConversation({
        clientId: currentUser.uid,
        clientName: currentUser.displayName,
        clientPhoto: currentUser.photoURL,
        artistId: artist.artistId,
        artistName: artist.fullName,
        artistPhoto: artist.profileImage
      });

      onNavigate('client-dashboard', { tab: 'messages', convId: conv.id });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-xs text-stone-400" dir="rtl">
        جارِ تحميل بروفايل الميك أب آرتست...
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-3" dir="rtl">
        <h2 className="text-xl font-bold font-serif-display text-stone-900">لم يتم العثور على الآرتست</h2>
        <p className="text-xs text-stone-500">الحساب المطلوب قد يكون تم إلغاء تفعيله أو الرابط غير صحيح.</p>
        <button
          onClick={() => onNavigate('discover')}
          className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
        >
          تصفحي كل الآرتستس
        </button>
      </div>
    );
  }

  // Filtered portfolio
  const filteredPortfolio = selectedPortfolioCategory === 'all'
    ? portfolio
    : portfolio.filter(item => item.categoryName?.toLowerCase() === selectedPortfolioCategory.toLowerCase());

  // Portfolio categories
  const uniqueCategories: string[] = Array.from(new Set(portfolio.map(p => p.categoryName || '').filter(Boolean)));

  // Review statistics
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percent };
  });

  return (
    <div className="pb-24 text-right" dir="rtl">
      
      {/* Banner & Profile Cover */}
      <div className="relative h-64 sm:h-80 bg-stone-900">
        <img
          src={artist.coverImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80'}
          alt={artist.fullName}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
      </div>

      {/* Main Profile Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={artist.profileImage}
                  alt={artist.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
                {artist.isVerified && (
                  <div
                    className="absolute -bottom-2 -left-2 p-1.5 rounded-full bg-stone-900 text-amber-400 shadow-md"
                    title="ميك أب آرتست موثقة ومعتمدة"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-stone-900">
                    {artist.fullName}
                  </h1>
                  {artist.isVerified && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
                      موثقة ومعتمدة
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500 font-mono text-left" dir="ltr">@{artist.username}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-600">
                  <div className="flex items-center gap-1" dir="ltr">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-stone-900">{artist.rating}</span>
                    <span className="text-stone-400">({artist.reviewCount} تقييم)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{artist.location}</span>
                  </div>
                  <span>•</span>
                  <span>خبرة {artist.experienceYears} سنوات</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                id="profile-favorite-btn"
                onClick={handleToggleFavorite}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${
                  isFavorited
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
                title="إضافة للمفضلة"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                id="profile-share-btn"
                onClick={handleShare}
                className="p-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors relative"
                title="مشاركة الرابط"
              >
                <Share2 className="w-4 h-4" />
                {copiedLink && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-0.5 px-2 rounded whitespace-nowrap">
                    تم نسخ الرابط!
                  </span>
                )}
              </button>

              <button
                id="profile-message-btn"
                onClick={handleStartConversation}
                className="px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-stone-600" />
                <span>محادثة فورية</span>
              </button>

              <button
                id="profile-book-now-btn"
                onClick={() => {
                  setPreselectedServiceId(services[0]?.serviceId);
                  setBookingModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>حجز ميعاد</span>
              </button>
            </div>

          </div>

          {/* Bio & Specialties */}
          <div className="pt-4 border-t border-stone-100 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">عن الآرتست وأسلوب العمل</h3>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                {artist.bio}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {artist.specialties?.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200/80"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Social & Safety */}
            <div className="space-y-3 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">الروابط وتوثيق الحساب</h3>
              <div className="space-y-1.5 text-xs text-stone-600">
                {artist.instagram && (
                  <a
                    href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-stone-900 transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5 text-rose-500" />
                    <span dir="ltr">{artist.instagram}</span>
                  </a>
                )}
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-stone-900 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    <span>الموقع الرسمي</span>
                  </a>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    إبلاغ الإدارة عن هذا الحساب
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Subnavigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex border-b border-stone-200 gap-8">
          <button
            id="tab-portfolio"
            onClick={() => setActiveTab('portfolio')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            معرض اللوكات ({portfolio.length})
          </button>

          <button
            id="tab-services"
            onClick={() => setActiveTab('services')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'services'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Tag className="w-4 h-4" />
            الخدمات والأسعار ({services.length})
          </button>

          <button
            id="tab-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            جدول ومواعيد العمل
          </button>

          <button
            id="tab-reviews"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Star className="w-4 h-4" />
            التقييمات والآراء ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="pt-8 space-y-6">
            {/* Category Filter Chips */}
            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPortfolioCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedPortfolioCategory === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  كل اللوكات ({portfolio.length})
                </button>
                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPortfolioCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      selectedPortfolioCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredPortfolio.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                مفيش صور لوكات متاحة في القسم ده حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPortfolio.map((item, index) => (
                  <div
                    key={item.itemId}
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                    className="group relative h-64 rounded-2xl overflow-hidden bg-stone-100 cursor-pointer shadow-xs hover:shadow-lg transition-all"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white text-right">
                      <span className="text-[10px] uppercase font-bold text-amber-300">
                        {item.categoryName || 'عرايس'}
                      </span>
                      <h4 className="font-bold text-sm font-serif-display leading-snug">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Services */}
        {activeTab === 'services' && (
          <div className="pt-8 space-y-4 max-w-4xl">
            {services.filter(s => s.isActive).length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                مفيش باكدجات أو خدمات مفعلة حالياً.
              </div>
            ) : (
              services.filter(s => s.isActive).map((service) => (
                <div
                  key={service.serviceId}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-stone-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold font-serif-display text-stone-900">
                        {service.name}
                      </h4>
                      {service.categoryName && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                          {service.categoryName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium pt-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>مدة الجلسة التقديرية: {service.duration} دقيقة</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="text-left">
                      <span className="text-[10px] text-stone-400 block">السعر</span>
                      <span className="text-lg font-bold font-serif-display text-stone-900">
                        {service.price} ج.م
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setPreselectedServiceId(service.serviceId);
                        setBookingModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      حجز الخدمة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Working Hours & Availability */}
        {activeTab === 'schedule' && (
          <div className="pt-8 max-w-2xl">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold font-serif-display text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                ساعات ومواعيد العمل الأسبوعية
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                يتم قبول الحجوزات حصرياً في المواعيد المتاحة للآرتست مع فحص فوري يمنع الحجز المزدوج.
              </p>

              <div className="divide-y divide-stone-100 pt-2">
                {availability ? (
                  (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => {
                    const dayConfig = availability.workingDays?.[day];
                    return (
                      <div key={day} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">{arabicDays[day] || day}</span>
                        {dayConfig && dayConfig.enabled ? (
                          <span className="text-stone-600 font-medium" dir="ltr">
                            {dayConfig.start} — {dayConfig.end}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">يوم إجازة / مغلق</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-stone-400">
                    مواعيد العمل المعتادة من السبت إلى الخميس 10:00 ص إلى 8:00 م.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Reviews & Ratings */}
        {activeTab === 'reviews' && (
          <div className="pt-8 space-y-8 max-w-4xl">
            
            {/* Rating Breakdown Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-l border-stone-200 md:pl-6 space-y-1">
                <div className="text-5xl font-bold font-serif-display text-stone-900">
                  {artist.rating}
                </div>
                <div className="flex items-center justify-center gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        Math.round(artist.rating) >= s
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-stone-500">
                  بناءً على {reviews.length} تقييم موثق
                </p>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                {ratingDistribution.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-stone-600 shrink-0">{star} نجوم</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-6 text-left text-stone-400 shrink-0 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                  مفيش تقييمات منشورة لسه للآرتست دي. كوني أول واحدة تحجز وتشارك تجربتها!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.reviewId}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.clientPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={rev.clientName}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-stone-900">{rev.clientName}</h5>
                          <span className="text-[11px] text-stone-400">
                            الخدمة: {rev.serviceName || 'ميك أب خاص'} • {new Date(rev.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= s ? 'text-amber-500 fill-amber-500' : 'text-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed pr-11">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>

      {/* Lightbox Modal for Portfolio */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={filteredPortfolio}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />

      {/* Booking Flow Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        artist={artist}
        services={services}
        initialServiceId={preselectedServiceId}
        onOpenAuth={() => onOpenAuth('login')}
        onBookingSuccess={() => {
          // Booking confirmed
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetId={artist.artistId}
        targetType="artist"
        targetTitle={artist.fullName}
      />

    </div>
  );
};
