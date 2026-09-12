import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Star,
  Upload,
  Image as ImageIcon,
  Tag,
  ShieldCheck,
  MessageSquare,
  Settings,
  X
} from 'lucide-react';
import {
  MakeupArtist,
  MakeupService,
  PortfolioItem,
  Booking,
  Review,
  Availability
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  getArtistById,
  getArtistServices,
  getArtistPortfolio,
  getArtistAvailability,
  createArtistService,
  deleteArtistService,
  saveArtistAvailability,
  uploadPortfolioItem,
  deletePortfolioItem,
  updateArtistProfile
} from '../services/artists/artistService';
import { getArtistBookings, updateBookingStatus } from '../services/bookings/bookingService';
import { getArtistReviews } from '../services/reviews/reviewService';
import { optimizeImage } from '../utils/imageOptimizer';
import { ChatView } from '../components/messaging/ChatView';

interface ArtistDashboardProps {
  initialTab?: string;
  onNavigate: (view: string, extra?: any) => void;
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

const statusArabicMap: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  rejected: 'مرفوض'
};

export const ArtistDashboard: React.FC<ArtistDashboardProps> = ({
  initialTab = 'bookings',
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [artist, setArtist] = useState<MakeupArtist | null>(null);
  const [services, setServices] = useState<MakeupService[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);

  // New Service Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('ميك أب عرايس');
  const [newServicePrice, setNewServicePrice] = useState<number>(2500);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(60);
  const [savingService, setSavingService] = useState(false);

  // New Portfolio Upload state
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('عرايس زفاف');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Profile edit state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const loadAllData = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const [aData, sData, pData, bData, rData, avData] = await Promise.all([
        getArtistById(currentUser.uid),
        getArtistServices(currentUser.uid),
        getArtistPortfolio(currentUser.uid),
        getArtistBookings(currentUser.uid),
        getArtistReviews(currentUser.uid),
        getArtistAvailability(currentUser.uid)
      ]);

      setArtist(aData);
      setServices(sData);
      setPortfolio(pData);
      setBookings(bData);
      setReviews(rData);
      setAvailability(avData);

      if (aData) {
        setBio(aData.bio || '');
        setLocation(aData.location || '');
        setSpecialtiesText((aData.specialties || []).join(', '));
        setInstagram(aData.instagram || '');
        setWebsite(aData.website || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser?.uid]);

  // Booking action handlers
  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected' | 'completed' | 'cancelled') => {
    if (!currentUser) return;
    try {
      await updateBookingStatus(
        bookingId,
        action,
        { id: currentUser.uid, name: currentUser.displayName, role: 'artist' }
      );
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newServiceName.trim()) return;

    setSavingService(true);
    try {
      await createArtistService(currentUser.uid, {
        name: newServiceName.trim(),
        description: newServiceDesc.trim(),
        categoryName: newServiceCategory,
        price: Number(newServicePrice),
        duration: Number(newServiceDuration),
        isActive: true
      });

      setServiceModalOpen(false);
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServicePrice(2500);
      setNewServiceDuration(60);
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!currentUser) return;
    if (window.confirm('هل متأكدة من حذف هذه الخدمة من قائمتك؟')) {
      await deleteArtistService(currentUser.uid, serviceId);
      await loadAllData();
    }
  };

  // Image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !uploadFile || !uploadTitle.trim()) return;

    setUploading(true);
    try {
      const optimized = await optimizeImage(uploadFile, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });

      await uploadPortfolioItem(currentUser.uid, optimized.file, {
        title: uploadTitle.trim(),
        categoryName: uploadCategory,
        description: uploadDesc.trim()
      });

      setPortfolioModalOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitle('');
      setUploadDesc('');
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolio = async (itemId: string) => {
    if (!currentUser) return;
    if (window.confirm('هل ترغبين في حذف هذه الصورة من معرض أعمالك؟')) {
      await deletePortfolioItem(currentUser.uid, itemId);
      await loadAllData();
    }
  };

  // Availability save
  const handleToggleDay = async (dayKey: keyof Availability['workingDays']) => {
    if (!currentUser || !availability) return;
    const currentDay = availability.workingDays[dayKey] || { enabled: false, start: '09:00', end: '17:00' };
    const updated: Availability = {
      ...availability,
      workingDays: {
        ...availability.workingDays,
        [dayKey]: {
          ...currentDay,
          enabled: !currentDay.enabled
        }
      }
    };
    setAvailability(updated);
    await saveArtistAvailability(currentUser.uid, updated);
  };

  const handleHoursChange = async (
    dayKey: keyof Availability['workingDays'],
    field: 'start' | 'end',
    val: string
  ) => {
    if (!currentUser || !availability) return;
    const currentDay = availability.workingDays[dayKey];
    const updated: Availability = {
      ...availability,
      workingDays: {
        ...availability.workingDays,
        [dayKey]: {
          ...currentDay,
          [field]: val
        }
      }
    };
    setAvailability(updated);
    await saveArtistAvailability(currentUser.uid, updated);
  };

  // Save profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingProfile(true);
    try {
      const specs = specialtiesText.split(',').map(s => s.trim()).filter(Boolean);
      await updateArtistProfile(currentUser.uid, {
        bio,
        location,
        specialties: specs,
        instagram,
        website
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedAppointments = bookings.filter(b => b.status === 'completed');
  const totalEarnings = [...confirmedBookings, ...completedAppointments].reduce((s, b) => s + (b.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right" dir="rtl">
      
      {/* Verification Status Alert Banner */}
      {artist && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
            artist.status === 'approved'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : artist.status === 'pending'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {artist.status === 'approved' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : artist.status === 'pending' ? (
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {artist.status === 'approved' && 'استوديو معتمد وموثق رسمياً على المنصة'}
                {artist.status === 'pending' && 'طلب الانضمام قيد المراجعة والتدقيق'}
                {artist.status === 'suspended' && 'تم إيقاف الحساب مؤقتاً'}
              </span>
              <span className="text-[11px] opacity-85">
                {artist.status === 'approved' && 'بروفايلك ظاهر في دليل البحث وتستطيعين استقبال طلبات حجز المواعيد من العميلات.'}
                {artist.status === 'pending' && 'يقوم فريق الإدارة بمراجعة بياناتك ومعرض أعمالك حالياً. تستطيعين تعديل خدماتك وأسعارك.'}
                {artist.status === 'suspended' && 'يرجى التواصل مع إدارة المنصة للاستفسار عن إعادة تفعيل الحساب.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('artist-profile', { artistId: artist.artistId })}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-bold text-stone-800 shrink-0 hover:bg-stone-50 transition-colors"
          >
            معاينة البروفايل العام
          </button>
        </div>
      )}

      {/* Overview & Quick KPIs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={artist?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={artist?.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-200 shadow-xs"
          />
          <div>
            <h1 className="text-2xl font-bold font-serif-display text-stone-900">
              {artist?.fullName || 'لوحة تحكم الآرتست'}
            </h1>
            <p className="text-xs text-stone-500">
              {artist?.location || 'مصر'} • {artist?.rating || 5.0} ★ ({artist?.reviewCount || 0} تقييم)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-center pt-4 md:pt-0 border-t md:border-t-0 border-stone-100">
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xl font-bold font-serif-display text-amber-900 block">{pendingRequests.length}</span>
            <span className="text-[10px] text-stone-500 font-bold">طلبات جديدة</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xl font-bold font-serif-display text-stone-900 block">{confirmedBookings.length}</span>
            <span className="text-[10px] text-stone-500 font-bold">حجوزات مؤكدة</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xl font-bold font-serif-display text-emerald-700 block">{totalEarnings} ج.م</span>
            <span className="text-[10px] text-stone-500 font-bold">الأرباح التقديرية</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xl font-bold font-serif-display text-stone-900 block">{services.length}</span>
            <span className="text-[10px] text-stone-500 font-bold">الخدمات</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          الحجوزات ({bookings.length})
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'services'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Tag className="w-4 h-4" />
          الخدمات والأسعار ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'portfolio'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          معرض اللوكات ({portfolio.length})
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'availability'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          جدول ومواعيد العمل
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Star className="w-4 h-4" />
          التقييمات ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'messages'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          المحادثات والرسائل
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          تعديل البروفايل
        </button>
      </div>

      {/* Tab 1: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              مفيش طلبات حجز مستلمة حتى الآن.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.bookingId}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold font-serif-display text-sm text-stone-900">
                        {b.serviceName}
                      </h4>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'completed'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {statusArabicMap[b.status] || b.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600">
                      العميلة: <strong>{b.clientName}</strong> ({b.clientPhone || b.clientEmail})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-stone-800">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {b.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-stone-800" dir="ltr">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {b.startTime} - {b.endTime} ({b.duration}m)
                      </span>
                      <span>•</span>
                      <span className="font-bold text-stone-900 font-serif-display">
                        {b.price} ج.م
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-[11px] text-stone-500 italic pt-1">
                        ملاحظات العميلة: "{b.notes}"
                      </p>
                    )}
                  </div>

                  {/* Booking State Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleBookingAction(b.bookingId, 'confirmed')}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          قبول الطلب
                        </button>
                        <button
                          onClick={() => handleBookingAction(b.bookingId, 'rejected')}
                          className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
                        >
                          اعتذار
                        </button>
                      </>
                    )}

                    {b.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleBookingAction(b.bookingId, 'completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تحديد كمكتمل
                        </button>
                        <button
                          onClick={() => handleBookingAction(b.bookingId, 'cancelled')}
                          className="px-3 py-2 text-xs text-stone-500 hover:text-rose-600 font-semibold"
                        >
                          إلغاء
                        </button>
                      </>
                    )}

                    {b.status === 'completed' && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        اكتملت الجلسة بنجاح
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Services Menu */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold font-serif-display text-stone-900">قائمة وباقات الخدمات والأسعار</h3>
              <p className="text-xs text-stone-500">أضيفي باقاتك، وحددي الأسعار ومدة كل جلسة لتظهر للعميلات.</p>
            </div>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة باقة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div
                key={srv.serviceId}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold font-serif-display text-sm text-stone-900">{srv.name}</h4>
                    <span className="font-bold text-base text-stone-900 font-serif-display">{srv.price} ج.م</span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-bold">{srv.categoryName || 'ميك أب عرايس'}</span>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{srv.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {srv.duration} دقيقة
                  </span>
                  <button
                    onClick={() => handleDeleteService(srv.serviceId)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="حذف الخدمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Portfolio Gallery Manager */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold font-serif-display text-stone-900">معرض اللوكات والأعمال</h3>
              <p className="text-xs text-stone-500">ارفعي صوراً عالية الجودة تبرز دقة ميك أب العرايس والمناسبات.</p>
            </div>
            <button
              onClick={() => setPortfolioModalOpen(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              رفع لوك جديد
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {portfolio.map((item) => (
              <div
                key={item.itemId}
                className="group relative h-60 rounded-2xl overflow-hidden bg-stone-100 shadow-xs border border-stone-200"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white text-right">
                  <div className="flex justify-start">
                    <button
                      onClick={() => handleDeletePortfolio(item.itemId)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">{item.categoryName}</span>
                    <span className="text-xs font-bold block">{item.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Availability & Schedule */}
      {activeTab === 'availability' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold font-serif-display text-stone-900">أيام وساعات العمل الأسبوعية</h3>
            <p className="text-xs text-stone-500">حددي الأيام وساعات البداية والنهاية لاستقبال الحجوزات بدقة.</p>
          </div>

          <div className="divide-y divide-stone-100">
            {availability && (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => {
              const d = availability.workingDays[day] || { enabled: false, start: '10:00', end: '20:00' };
              return (
                <div key={day} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2.5 font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={() => handleToggleDay(day)}
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <span>{arabicDays[day] || day}</span>
                  </label>

                  {d.enabled ? (
                    <div className="flex items-center gap-2" dir="ltr">
                      <input
                        type="time"
                        value={d.start}
                        onChange={(e) => handleHoursChange(day, 'start', e.target.value)}
                        className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs"
                      />
                      <span className="text-stone-400">إلى</span>
                      <input
                        type="time"
                        value={d.end}
                        onChange={(e) => handleHoursChange(day, 'end', e.target.value)}
                        className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-stone-400 italic">يوم إجازة / مغلق</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Reviews */}
      {activeTab === 'reviews' && (
        <div className="max-w-3xl space-y-4">
          <h3 className="text-base font-bold font-serif-display text-stone-900">تقييمات وآراء العميلات</h3>
          {reviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              مفيش تقييمات حتى الآن. ستظهر التقييمات تلقائياً هنا بمجرد اكتمال الجلسات وتقييم العميلات لها.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.reviewId} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">{r.clientName}</h5>
                    <span className="text-[11px] text-stone-400">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center gap-0.5" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          r.rating >= s ? 'text-amber-500 fill-amber-500' : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Messages */}
      {activeTab === 'messages' && (
        <div>
          <ChatView />
        </div>
      )}

      {/* Tab 7: Profile Editor */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold font-serif-display text-stone-900">إعدادات وبيانات البروفايل</h3>

          {profileSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              تم تحديث بيانات البروفايل بنجاح!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">النبذة التعريفية وأسلوب الشغل</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">الموقع الجغرافي والمدينة</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">التخصصات (مفصولة بفواصل)</label>
              <input
                type="text"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="ميك أب عرايس، سواريه فخم، لوك ناعم طبيعي"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">حساب إنستغرام</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">رابط الموقع الرسمي</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'جارِ الحفظ...' : 'حفظ تعديلات البروفايل'}
            </button>
          </form>
        </div>
      )}

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-right">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold font-serif-display text-stone-900">إضافة باقة أو خدمة جديدة</h3>
              <button onClick={() => setServiceModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">اسم الباقة أو الخدمة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باقة العروسة الملكية الشاملة"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">التصنيف</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                >
                  <option>ميك أب عرايس</option>
                  <option>ميك أب خطوبة وسواريه</option>
                  <option>ميك أب تصوير وفوتوسيشن</option>
                  <option>ميك أب ناعم صباحي</option>
                  <option>جلسة استشارة وميك أب تجريبي</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">المدة التقريبية (بالدقائق)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">تفاصيل ومميزات الباقة</label>
                <textarea
                  rows={3}
                  placeholder="ما تتضمنه الباقة (مثال: رموش منك طبيعية، تهيئة للبشرة، ريتاتش، منتجات أصلية مقاومة للماء)"
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                />
              </div>

              <button
                type="submit"
                disabled={savingService}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {savingService ? 'جارِ الحفظ...' : 'إضافة الخدمة'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Portfolio Modal */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-right">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold font-serif-display text-stone-900">رفع لوك جديد للمعرض</h3>
              <button onClick={() => setPortfolioModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPortfolio} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">ملف الصورة</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-stone-500 file:ml-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                />
                {uploadPreview && (
                  <div className="mt-2 h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img src={uploadPreview} alt="معاينة" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">عنوان اللوك</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لوك عروسة ملكي رومانسي"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">التصنيف</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                >
                  <option>عرايس زفاف</option>
                  <option>سواريه وخطوبة</option>
                  <option>فوتوسيشن وإعلانات</option>
                  <option>لوك ناعم طبيعي</option>
                  <option>ميك أب سينمائي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">تفاصيل إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="التقنيات المستخدمة أو درجات الألوان..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-right"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {uploading ? 'جارِ معالجة ورفع الصورة...' : 'رفع إلى المعرض'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
