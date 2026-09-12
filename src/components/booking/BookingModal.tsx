import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MakeupArtist, MakeupService, Booking } from '../../types';
import { getAvailableTimeSlots, AvailableSlot, createBooking } from '../../services/bookings/bookingService';
import { useAuth } from '../../contexts/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: MakeupArtist;
  services: MakeupService[];
  initialServiceId?: string;
  onBookingSuccess?: (booking: Booking) => void;
  onOpenAuth?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  artist,
  services,
  initialServiceId,
  onBookingSuccess,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || (services[0]?.serviceId || '')
  );

  // Default to tomorrow in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const selectedService = services.find(s => s.serviceId === selectedServiceId) || services[0];

  // Fetch available slots when date or service changes
  useEffect(() => {
    if (!isOpen || !selectedService || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);

      try {
        const slots = await getAvailableTimeSlots(
          artist.artistId,
          selectedDate,
          selectedService.duration
        );
        if (isMounted) {
          setAvailableSlots(slots);
          const firstAvailable = slots.find(s => s.isAvailable);
          if (firstAvailable) setSelectedSlot(firstAvailable);
        }
      } catch (err: any) {
        if (isMounted) setError('تعذر تحميل أوقات العمل لهذا اليوم.');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => { isMounted = false; };
  }, [isOpen, artist.artistId, selectedDate, selectedServiceId, selectedService?.duration]);

  if (!isOpen) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!selectedService || !selectedSlot) {
      setError('من فضلك اختاري الخدمة والوقت المناسب المتاح.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await createBooking({
      artistId: artist.artistId,
      artistName: artist.fullName,
      artistImage: artist.profileImage,
      clientId: currentUser.uid,
      clientName: currentUser.displayName,
      clientEmail: currentUser.email,
      clientPhone: currentUser.phone || '',
      serviceId: selectedService.serviceId,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      notes
    });

    setSubmitting(false);

    if (!res.success || !res.booking) {
      setError(res.error || 'هذا الميعاد محجوز أو به تعارض، من فضلك اختاري وقتاً آخر.');
    } else {
      setConfirmedBooking(res.booking);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // confetti fallback
      }
      if (onBookingSuccess) {
        onBookingSuccess(res.booking);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col text-right">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <img
              src={artist.profileImage}
              alt={artist.fullName}
              className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
            />
            <div>
              <h2 className="text-base font-bold font-serif-display text-white">
                حجز ميعاد مع {artist.fullName}
              </h2>
              <p className="text-xs text-stone-300">
                {artist.location} • {artist.rating} ★ ({artist.reviewCount} تقييم)
              </p>
            </div>
          </div>
          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {confirmedBooking ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-serif-display text-stone-900">
                تم إرسال طلب الحجز بنجاح! 🎉
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                تم تسجيل طلب ميعادك لـ <strong>{confirmedBooking.serviceName}</strong> يوم{' '}
                <strong>{confirmedBooking.date}</strong> الساعة <strong>{confirmedBooking.startTime}</strong> مع الميك أب آرتست {artist.fullName}.
              </p>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-right max-w-sm mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">الخدمة:</span>
                  <span className="font-semibold text-stone-800">{confirmedBooking.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">الميعاد والوقت:</span>
                  <span className="font-semibold text-stone-800">{confirmedBooking.date} • {confirmedBooking.startTime} إلى {confirmedBooking.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">المدة المتوقعة:</span>
                  <span className="font-semibold text-stone-800">{confirmedBooking.duration} دقيقة</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200">
                  <span className="text-stone-700 font-bold">السعر التقديري:</span>
                  <span className="font-bold text-amber-900 text-sm">{confirmedBooking.price} ج.م</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  id="booking-finish-btn"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  تمام • الذهاب لحجوزاتي
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Select Service */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  ١. اختاري نوع الخدمة أو الباكدج
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
                  {services.filter(s => s.isActive).map((srv) => (
                    <div
                      key={srv.serviceId}
                      onClick={() => setSelectedServiceId(srv.serviceId)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedServiceId === srv.serviceId
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-800 bg-stone-50/50'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-sm">{srv.name}</span>
                        <span className={`text-[11px] block mt-0.5 ${selectedServiceId === srv.serviceId ? 'text-stone-300' : 'text-stone-500'}`}>
                          {srv.duration} دقيقة • {srv.categoryName || 'عرايس'}
                        </span>
                      </div>
                      <div className="text-left font-bold text-sm">
                        {srv.price} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Select Date */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-stone-500" />
                  ٢. اختاري تاريخ الميعاد والمناسبة
                </label>
                <input
                  id="booking-date-input"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
                />
              </div>

              {/* 3. Time Slots */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  ٣. اختاري الساعة المتاحة
                </label>

                {loadingSlots ? (
                  <div className="py-6 text-center text-xs text-stone-400 animate-pulse">
                    جارِ مراجعة جدول مواعيد وحجوزات الآرتست...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center text-xs text-amber-900 leading-relaxed">
                    مفيش مواعيد فاضية في التاريخ ده، الآرتست ممكن تكون محجوزة بالكامل أو في إجازة. جربي تختاري تاريخ تاني.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition-all ${
                          !slot.isAvailable
                            ? 'bg-stone-100 text-stone-300 line-through cursor-not-allowed border border-transparent'
                            : selectedSlot?.startTime === slot.startTime
                            ? 'bg-stone-900 text-white font-semibold shadow-xs'
                            : 'bg-white border border-stone-200 hover:border-stone-800 text-stone-700'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  ٤. ملاحظات خاصة أو تفاصيل المكان (اختياري)
                </label>
                <textarea
                  id="booking-notes-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: الفرح هيبدأ 7 مساءً، العنوان في التجمع الخامس، محتاجة تثبيت قوي للدموع..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
                />
              </div>

              {/* Summary Bar */}
              {selectedService && selectedSlot && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-800 block">{selectedService.name}</span>
                    <span className="text-stone-500 text-[11px] block">
                      {selectedDate} • الساعة {selectedSlot.startTime} إلى {selectedSlot.endTime} ({selectedService.duration} دقيقة)
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-stone-400 block">سعر الخدمة</span>
                    <span className="text-base font-bold text-stone-900 font-serif-display">{selectedService.price} ج.م</span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              {!currentUser ? (
                <button
                  id="booking-login-first-btn"
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  سجلي دخولك أولاً لتأكيد الحجز
                </button>
              ) : (
                <button
                  id="booking-submit-btn"
                  type="submit"
                  disabled={submitting || !selectedSlot || !selectedSlot.isAvailable}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'جارِ التحقق وتأكيد الطلب...' : 'تأكيد وإرسال طلب الحجز'}
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
