import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  ArrowLeft,
  CheckCircle2,
  Award,
  ChevronLeft
} from 'lucide-react';
import { MakeupArtist, ServiceCategory } from '../types';
import { getFeaturedArtists, getCategories } from '../services/artists/artistService';
import { isArtistFavorited, toggleFavorite } from '../services/favorites/favoriteService';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onNavigate: (view: string, extra?: any) => void;
  onOpenBooking: (artist: MakeupArtist) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenBooking,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();
  const [featuredArtists, setFeaturedArtists] = useState<MakeupArtist[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [favoritedIds, setFavoritedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const [artists, cats] = await Promise.all([
        getFeaturedArtists(),
        getCategories()
      ]);
      setFeaturedArtists(artists);
      setCategories(cats);

      if (currentUser?.uid) {
        const favs: Record<string, boolean> = {};
        for (const a of artists) {
          favs[a.artistId] = await isArtistFavorited(currentUser.uid, a.artistId);
        }
        setFavoritedIds(favs);
      }
    };
    load();
  }, [currentUser?.uid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('discover', {
      search: searchQuery,
      city: selectedCity
    });
  };

  const handleFavoriteClick = async (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    const newStatus = await toggleFavorite(currentUser.uid, artistId);
    setFavoritedIds(prev => ({ ...prev, [artistId]: newStatus }));
  };

  return (
    <div className="space-y-20 pb-20" dir="rtl">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-950 text-white pt-20 pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-800/90 border border-stone-700/80 text-amber-300 text-xs font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المنصة الأولى والوجهة الموثوقة لميك أب آرتست مصر 🇪🇬</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold font-serif-display tracking-tight text-stone-50 leading-[1.2]">
              تألقي بأجمل إطلالة في ليلتك مع <br />
              <span className="italic font-normal text-amber-200">أشطر ميك أب آرتستس مصر</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto font-normal">
              تصفحي، قارني، واحجزي خبيرات التجميل المعتمدات لعرايس الزفاف، حفلات الخطوبة، السواريه، وجلسات التصوير في الصالون أو هوم سيرفيس بالبيت.
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 p-2.5 bg-white rounded-2xl shadow-2xl border border-stone-200 text-stone-900 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
            >
              <div className="flex-1 flex items-center px-3.5 py-2 bg-stone-50 md:bg-transparent rounded-xl">
                <Search className="w-4 h-4 text-stone-400 ml-2.5 shrink-0" />
                <input
                  id="hero-search-query-input"
                  type="text"
                  placeholder="ابحثي باسم الآرتست أو اللوك (مثلاً: عرايس، سواريه، جلاس سكين)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-stone-400 text-right"
                />
              </div>

              <div className="flex items-center px-3.5 py-2 bg-stone-50 md:bg-transparent rounded-xl border-t md:border-t-0 md:border-r border-stone-200">
                <MapPin className="w-4 h-4 text-stone-400 ml-2 shrink-0" />
                <select
                  id="hero-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full md:w-44 bg-transparent text-xs sm:text-sm focus:outline-none text-stone-700 cursor-pointer text-right"
                >
                  <option value="">كل المناطق والمحافظات</option>
                  <option value="القاهرة">القاهرة (التجمع والمعادي ومصر الجديدة)</option>
                  <option value="الجيزة">الجيزة (الشيخ زايد وأكتوبر والمهندسين)</option>
                  <option value="الإسكندرية">الإسكندرية والساحل الشمالي</option>
                </select>
              </div>

              <button
                id="hero-search-submit-btn"
                type="submit"
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                <span>تصفحي الآرتستس</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>

            {/* Popular category chips */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-400">
              <span className="font-semibold text-stone-400">الأكثر طلباً:</span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('discover', { category: cat.name })}
                  className="px-3 py-1 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Featured Verified Artists */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              نخبة الميك أب آرتستس المعتمدات
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-stone-900">
              أفضل الميك أب آرتستس الموثقين
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              خبيرات محترفات بمعرض أعمال حقيقي وتقييمات موثقة من عرايس وزباين المنصة.
            </p>
          </div>
          <button
            onClick={() => onNavigate('discover')}
            className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-amber-800 transition-colors"
          >
            <span>عرض كل الآرتستس</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredArtists.map((artist) => (
            <div
              key={artist.artistId}
              onClick={() => onNavigate('artist-profile', { artistId: artist.artistId })}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col text-right"
            >
              {/* Cover & Avatar Header */}
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img
                  src={artist.coverImage || artist.profileImage}
                  alt={artist.fullName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Favorite button */}
                <button
                  onClick={(e) => handleFavoriteClick(e, artist.artistId)}
                  className="absolute top-3 left-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
                  aria-label="إضافة للمفضلة"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favoritedIds[artist.artistId]
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-white'
                    }`}
                  />
                </button>

                {/* Verified badge */}
                {artist.isVerified && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-amber-300 text-[11px] font-semibold border border-amber-400/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    موثقة ومعتمدة
                  </div>
                )}

                {/* Avatar floating */}
                <div className="absolute -bottom-5 right-4">
                  <img
                    src={artist.profileImage}
                    alt={artist.fullName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="pt-7 p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold font-serif-display text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                      {artist.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-stone-800" dir="ltr">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{artist.rating}</span>
                      <span className="text-stone-400 font-normal">({artist.reviewCount})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-stone-500 mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{artist.location}</span>
                    <span className="mx-1">•</span>
                    <span>خبرة {artist.experienceYears} سنوات</span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {artist.bio}
                  </p>

                  {/* Specialties tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {artist.specialties?.slice(0, 3).map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer price & CTA */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block">يبدأ من</span>
                    <span className="text-base font-bold font-serif-display text-stone-900">
                      {artist.startingPrice || 1800} ج.م
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('artist-profile', { artistId: artist.artistId });
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    عرض الباكدجات واللوكات
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-stone-100/70 border-y border-stone-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-serif-display text-stone-900">
              احجزي ميعادك في ٣ خطوات سهلة وبسيطة
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
              من استعراض لوكات خبيرات عرايس وسواريه مصر لحد تأكيد ميعادك المناسب في دقايق.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-center relative">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-bold font-mono text-base flex items-center justify-center mx-auto">
                ٠١
              </div>
              <h3 className="font-bold font-serif-display text-lg text-stone-900">
                اختاري وتصفحي اللوكات
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                ابحثي حسب المنطقة (القاهرة، زايد، إسكندرية)، نوع المناسبة (عرايس، سواريه، خطوبة)، والأسعار. شوفي صور اللوكات بجودة عالية.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-center relative">
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-white font-bold font-mono text-base flex items-center justify-center mx-auto">
                ٠٢
              </div>
              <h3 className="font-bold font-serif-display text-lg text-stone-900">
                حددي الباكدج والساعة المتاحة
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                اختاري الباكدج المناسبة وشوفي مواعيد الآرتست المتاحة فوراً في اليوم المطلوب بنظام يمنع التضارب نهائياً.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-center relative">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 font-bold font-mono text-base flex items-center justify-center mx-auto">
                ٠٣
              </div>
              <h3 className="font-bold font-serif-display text-lg text-stone-900">
                تأكيد وشات مباشر
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                تواصلي مع الآرتست مباشرة في شات المنصة، ابعتيلها صور الاستايل اللي حاباه، واستمتعي بيومك وتقييم التجربة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hygiene & Standards Commitment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white rounded-3xl p-8 sm:p-12 border border-stone-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                <Award className="w-3.5 h-3.5" />
                معيار أورا للسلامة والجودة
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold font-serif-display leading-tight text-stone-50">
                تعقيم فائق وأعلى معايير النظافة للخامات
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                كل ميك أب آرتست في المنصة تلتزم ببروتوكولات نظافة وتعقيم صارمة: تعقيم طبي للفرش قبل كل عميلة، استخدام أدوات ماسكرا ورموش فردية معقمة، وماتريال وبراندات أصلية 100% لحماية ونضارة بشرتك.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>فحص دوري لتعقيم الأدوات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>توثيق الهوية وسابقة الأعمال</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>أسعار واضحة بدون مصاريف خفية</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-700/60 rounded-2xl p-6 backdrop-blur-xs space-y-4 text-right">
              <h4 className="text-sm font-bold font-serif-display text-amber-200">
                إنتي ميك أب آرتست محترفة في مصر؟
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                اعرضي شغلك ولوكاتك لآلاف العرايس والجميلات، نظمي جدول مواعيدك وحجوزاتك بكل سهولة وبدون تعارض، واكبري باسمك في السوق.
              </p>
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                انضمي كآرتست وسجلي معانا اليوم
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
