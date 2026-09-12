import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { MakeupArtist, ServiceCategory } from '../types';
import { getArtists, getCategories } from '../services/artists/artistService';
import { isArtistFavorited, toggleFavorite } from '../services/favorites/favoriteService';
import { useAuth } from '../contexts/AuthContext';

interface DiscoverViewProps {
  initialSearch?: string;
  initialCity?: string;
  initialCategory?: string;
  onNavigate: (view: string, extra?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  initialSearch = '',
  initialCity = '',
  initialCategory = '',
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();
  const [artists, setArtists] = useState<MakeupArtist[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('rating_desc');
  const [favoritedIds, setFavoritedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [artistList, catList] = await Promise.all([
          getArtists({ status: 'approved' }),
          getCategories()
        ]);
        setArtists(artistList);
        setCategories(catList);

        if (currentUser?.uid) {
          const favs: Record<string, boolean> = {};
          for (const a of artistList) {
            favs[a.artistId] = await isArtistFavorited(currentUser.uid, a.artistId);
          }
          setFavoritedIds(favs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.uid]);

  const handleFavoriteClick = async (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    const newStatus = await toggleFavorite(currentUser.uid, artistId);
    setFavoritedIds(prev => ({ ...prev, [artistId]: newStatus }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedCategory('');
    setMaxPrice(10000);
    setMinRating(0);
    setMinExperience(0);
    setVerifiedOnly(false);
    setSortBy('rating_desc');
  };

  // Filtered and sorted artists
  const filteredArtists = useMemo(() => {
    return artists.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.fullName.toLowerCase().includes(q);
        const matchesBio = a.bio?.toLowerCase().includes(q);
        const matchesSpecialties = a.specialties?.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesBio && !matchesSpecialties) return false;
      }

      if (selectedCity && !a.location?.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }

      if (selectedCategory) {
        const hasCategory = a.specialties?.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!hasCategory) return false;
      }

      if (a.startingPrice && a.startingPrice > maxPrice) {
        return false;
      }

      if (minRating > 0 && a.rating < minRating) {
        return false;
      }

      if (minExperience > 0 && a.experienceYears < minExperience) {
        return false;
      }

      if (verifiedOnly && !a.isVerified) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating_desc') return b.rating - a.rating;
      if (sortBy === 'reviews_desc') return b.reviewCount - a.reviewCount;
      if (sortBy === 'price_asc') return (a.startingPrice || 0) - (b.startingPrice || 0);
      if (sortBy === 'price_desc') return (b.startingPrice || 0) - (a.startingPrice || 0);
      if (sortBy === 'experience_desc') return b.experienceYears - a.experienceYears;
      return 0;
    });
  }, [artists, searchQuery, selectedCity, selectedCategory, maxPrice, minRating, minExperience, verifiedOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8" dir="rtl">
      
      {/* Top Header */}
      <div className="space-y-2 text-right">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif-display text-stone-900">
          استكشاف الميك أب آرتستس
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-2xl">
          تصفحي خبيرات التجميل المعتمدات في مصر، شاهدي معرض الصور بجودة عالية، واحجزي مواعيدك بأمان وسهولة.
        </p>
      </div>

      {/* Main Filter & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Right Sidebar Filters (in RTL, first col) */}
        <div className="lg:col-span-1 space-y-6 text-right">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                فلاتر البحث
              </div>
              <button
                id="reset-filters-btn"
                onClick={handleResetFilters}
                className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">بحث بالاسم أو الاستايل</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="اسم الآرتست، ستايل الميك أب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:bg-white text-right"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">المنطقة أو المحافظة</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none text-right font-medium"
              >
                <option value="">كل المناطق</option>
                <option value="القاهرة">القاهرة (التجمع والمعادي ومصر الجديدة)</option>
                <option value="الجيزة">الجيزة (الشيخ زايد وأكتوبر والمهندسين)</option>
                <option value="الإسكندرية">الإسكندرية والساحل الشمالي</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">نوع الخدمة والمناسبة</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none text-right font-medium"
              >
                <option value="">كل التخصصات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Starting Price */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-bold text-stone-700">الحد الأقصى للسعر</span>
                <span className="font-bold text-amber-900">{maxPrice} ج.م</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>١,٠٠٠ ج.م</span>
                <span>١٥,٠٠٠+ ج.م</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الحد الأدنى للتقييم</label>
              <div className="grid grid-cols-4 gap-1.5" dir="ltr">
                {[0, 4.0, 4.5, 4.8].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setMinRating(score)}
                    className={`py-1 text-center text-xs rounded-lg border transition-all ${
                      minRating === score
                        ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-white'
                    }`}
                  >
                    {score === 0 ? 'الكل' : `${score}★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الخبرة العملية</label>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none text-right font-medium"
              >
                <option value={0}>أي عدد سنوات خبرة</option>
                <option value={2}>خبرة سنتين فأكثر</option>
                <option value={5}>خبرة ٥+ سنوات (محترفة متقدمة)</option>
                <option value={7}>خبرة ٧+ سنوات (خبيرة معتمدة)</option>
              </select>
            </div>

            {/* Verified Badge Checkbox */}
            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-center gap-2.5 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  آرتستس موثقات ومعتمدات فقط
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* Content: Grid & Sorting */}
        <div className="lg:col-span-3 space-y-6 text-right">
          
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-stone-500 font-medium">
              يتم عرض <strong className="text-stone-900 font-bold">{filteredArtists.length}</strong> ميك أب آرتست
            </span>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-stone-500">الترتيب:</span>
              <select
                id="artist-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer text-right"
              >
                <option value="rating_desc">الأعلى تقييماً</option>
                <option value="reviews_desc">الأكثر تقييمات</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="experience_desc">سنوات الخبرة</option>
              </select>
            </div>
          </div>

          {/* Artists Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-stone-400">
              جارِ تحميل الميك أب آرتستس من قاعدة البيانات...
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
              <Sparkles className="w-10 h-10 text-amber-500/50 mx-auto" />
              <h3 className="text-lg font-bold font-serif-display text-stone-900">
                مفيش ميك أب آرتستس مطابقة لاختياراتك
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                جربي توسعي الحد الأقصى للسعر، أو اختاري منطقة تانية، أو الغي بعض الفلاتر لعرض نتائج أكتر.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                إعادة ضبط كل الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.artistId}
                  onClick={() => onNavigate('artist-profile', { artistId: artist.artistId })}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between text-right"
                >
                  <div>
                    {/* Cover & Avatar */}
                    <div className="relative h-44 bg-stone-100 overflow-hidden">
                      <img
                        src={artist.coverImage || artist.profileImage}
                        alt={artist.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, artist.artistId)}
                        className="absolute top-3 left-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
                        aria-label="حفظ في المفضلة"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favoritedIds[artist.artistId]
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-white'
                          }`}
                        />
                      </button>

                      {/* Verified Badge */}
                      {artist.isVerified && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-amber-300 text-[10px] font-semibold border border-amber-400/30 flex items-center gap-1 backdrop-blur-xs">
                          <ShieldCheck className="w-3 h-3" />
                          موثقة
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="absolute -bottom-4 right-4">
                        <img
                          src={artist.profileImage}
                          alt={artist.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      </div>
                    </div>

                    {/* Artist Details */}
                    <div className="pt-6 p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold font-serif-display text-sm text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                          {artist.fullName}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-semibold text-stone-800 shrink-0" dir="ltr">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{artist.rating}</span>
                          <span className="text-stone-400 font-normal text-[11px]">({artist.reviewCount})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{artist.location}</span>
                        <span>•</span>
                        <span className="shrink-0">خبرة {artist.experienceYears} سنوات</span>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {artist.bio}
                      </p>

                      {/* Specialties tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {artist.specialties?.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price & Book CTA */}
                  <div className="p-4 pt-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div>
                      <span className="text-[10px] text-stone-400 block">يبدأ من</span>
                      <span className="text-sm font-bold font-serif-display text-stone-900">
                        {artist.startingPrice || 1800} ج.م
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-stone-800 group-hover:text-amber-800 flex items-center gap-0.5">
                      عرض البروفايل
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
