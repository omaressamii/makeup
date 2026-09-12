import React, { useState } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

interface LegalPagesProps {
  onNavigate: (view: string) => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ onNavigate }) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'hygiene'>('privacy');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-right" dir="rtl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          معايير الأمان والثقة في المنصة
        </div>
        <h1 className="text-3xl font-bold font-serif-display text-stone-900">
          الشروط والأحكام ومعايير التعقيم
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          آخر تحديث: {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setTab('privacy')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'privacy'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          سياسة الخصوصية
        </button>
        <button
          onClick={() => setTab('terms')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'terms'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          شروط الاستخدام والحجز
        </button>
        <button
          onClick={() => setTab('hygiene')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'hygiene'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          ميثاق النظافة والتعقيم الطبي
        </button>
      </div>

      {tab === 'privacy' && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6 text-xs text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">1. خصوصية وسرية البيانات</h3>
            <p>
              تعتمد منصة الميك أب على بنية سحابية آمنة بتقنيات Google Firebase. جميع بيانات العميلات، بما في ذلك مواعيد الحجوزات والمحادثات المباشرة والتقييمات، مشفرة ومحفوظة بأعلى درجات الأمان وحماية الخصوصية.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">2. جمع واستخدام البيانات</h3>
            <p>
              نجمع فقط البيانات الضرورية لإتمام وتنظيم مواعيد الحجز: الاسم، رقم الهاتف للتواصل، وموقع المناسبة أو العنوان. لا يتم مشاركة أرقام الهواتف إلا بعد تأكيد الحجز رسمياً بين العميلة والآرتست.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">3. حقوق صور معرض الأعمال</h3>
            <p>
              تحتفظ كل ميك أب آرتست بكافة حقوق الملكية الفكرية لصور اللوكات التي ترفعها على المنصة. وتمنح العميلة التي تشارك صوراً مع تقييماتها ترخيصاً للمنصة لعرضها إلى جانب التقييم المعتمد فقط.
            </p>
          </section>
        </div>
      )}

      {tab === 'terms' && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6 text-xs text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">1. اتفاقية وشروط الحجز</h3>
            <p>
              عند إرسال طلب حجز، يتم تعليق الميعاد كطلب قيد الانتظار حتى تقوم الآرتست بالاطلاع والموافقة. بمجرد تأكيد الآرتست، يعتبر الميعاد مؤكداً رسمياً طبقاً للباقة والمدة والأسعار المعلنة.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">2. سياسة التعديل والإلغاء</h3>
            <p>
              يمكن إلغاء أو تعديل الحجز قبل الموعد بـ 48 ساعة دون أي التزامات. في الحالات الطارئة النادرة من طرف الآرتست، يتم إشعار العميلة فوراً وترتيب بديل فوري مع آرتست معتمدة أخرى.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">3. مصداقية التقييمات</h3>
            <p>
              لضمان أعلى درجات الثقة والمصداقية، لا يُسمح بإضافة تقييم إلا بعد إتمام جلسة الحجز الفعلية. يتم فحص ومنع التقييمات المزيفة أو المكررة تلقائياً.
            </p>
          </section>
        </div>
      )}

      {tab === 'hygiene' && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6 text-xs text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold font-serif-display text-stone-900">ميثاق التعقيم والوقاية الاحترافي</h3>
            <p>
              تلتزم كل خبيرة ميك أب معتمدة على المنصة بأعلى معايير النظافة والتعقيم الطبي لضمان سلامة وصحة بشرة كل عميلة:
            </p>
            <ul className="space-y-3 pt-2 text-stone-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>تعقيم وتطهير الفرش والبيوتي بلندر:</strong> تعقيم فوري بكحول 70%+ وغسيل عميق للفرش والإسفنج بين كل جلسة عميلة وأخرى.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>استخدام الباليتات والسباتيولا (No Double-Dipping):</strong> أخذ الكريمات والفاونديشن والروج بسباتيولا نظيفة على باليتة معدنية معقمة، دون لمس العبوات الأصلية مباشرة.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>أدوات تستخدم لمرة واحدة (Disposable):</strong> فرش الماسكرا والشفاه للاستخدام الفردي فقط دون إعادة غمسها في المنتج لضمان أقصى حماية للعين والبشرة.</span>
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
