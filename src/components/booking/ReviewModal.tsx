import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Booking } from '../../types';
import { submitReview } from '../../services/reviews/reviewService';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onReviewSubmitted
}) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment.trim()) {
      setError('من فضلك اكتبي تعليقاً يوضح رأيك في الخدمة واللوك.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await submitReview({
      bookingId: booking.bookingId,
      artistId: booking.artistId,
      clientId: currentUser.uid,
      clientName: currentUser.displayName,
      clientPhoto: currentUser.photoURL,
      rating,
      comment,
      serviceName: booking.serviceName
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'فشل في نشر التقييم، يرجى المحاولة لاحقاً.');
    } else {
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-serif-display text-white">
              تقييم جلستك مع الميك أب آرتست
            </h2>
          </div>
          <button
            id="close-review-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-serif-display text-stone-900">
                شكراً جداً لرأيك وتجربتك! ❤️
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                تقييمك الموثق اتنشر في صفحة {booking.artistName} وهيساعد عرايس وزباين تانية يختاروا بثقة.
              </p>
              <button
                id="finish-review-btn"
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                <p className="font-bold text-stone-800">{booking.serviceName}</p>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  الميك أب آرتست: {booking.artistName} • تم في {booking.date}
                </p>
              </div>

              {/* Star rating selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2 text-center">
                  تقييمك العام للتجربة
                </label>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-115"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-stone-500 mt-1 font-semibold">
                  {rating === 5 && 'تحفة فوق الممتاز — لوك يجنن وثابت طول الليلة!'}
                  {rating === 4 && 'شاطرة جداً ومواعيدها مظبوطة وخامات نظيفة'}
                  {rating === 3 && 'جيد ومناسب'}
                  {rating === 2 && 'أقل من المتوقع، محتاج تحسين'}
                  {rating === 1 && 'تجربة غير مرضية'}
                </p>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اكتبي رأيك وتجربتك بالتفصيل
                </label>
                <textarea
                  id="review-comment-textarea"
                  rows={4}
                  required
                  placeholder="إيه رأيك في نظافة الفرش والخامات، الالتزام بالميعاد، راحة التعامل، وثبات اللوك طول المناسبة؟"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 text-right leading-relaxed"
                />
              </div>

              <button
                id="submit-review-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'جارِ نشر التقييم...' : 'نشر التقييم الموثق'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
