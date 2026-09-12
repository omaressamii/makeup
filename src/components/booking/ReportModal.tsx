import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createReport } from '../../services/admin/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'artist' | 'review' | 'user';
  targetTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('صور أو محتوى غير لائق');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    await createReport({
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName,
      targetId,
      targetType,
      targetTitle: targetTitle || `${targetType} #${targetId.slice(0, 8)}`,
      reason: `${category}: ${reason.trim()}`
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right">
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-sm">إبلاغ الإدارة عن محتوى أو مخالفة</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-stone-900 text-sm">تم إرسال البلاغ بنجاح</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                فريق المتابعة والأمان في منصة أورا هيراجع البلاغ بدقة لاتخاذ الإجراء المناسب لحماية مجتمعنا.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نوع المخالفة</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                >
                  <option value="صور أو محتوى غير لائق">صور أو محتوى غير لائق</option>
                  <option value="صور مسروقة أو أسعار غير مطابقة">صور مسروقة أو أسعار غير مطابقة</option>
                  <option value="تأخير أو عدم حضور في الميعاد المحدد">تأخير أو عدم حضور في الميعاد المحدد</option>
                  <option value="ملاحظات على نظافة الخامات والتعقيم">ملاحظات على نظافة الخامات والتعقيم</option>
                  <option value="رسائل مزعجة أو تعامل غير لائق">رسائل مزعجة أو تعامل غير لائق</option>
                  <option value="مخالفة أخرى">مخالفة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">تفاصيل البلاغ</label>
                <textarea
                  rows={3}
                  required
                  placeholder="من فضلك وضحي تفاصيل المشكلة علشان نقدر نتحقق منها ونساعدك..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-right leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'جارِ الإرسال...' : 'إرسال البلاغ للإدارة'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
