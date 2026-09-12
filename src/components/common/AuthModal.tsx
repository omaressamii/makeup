import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'client'
}) => {
  const { login, register, sendPasswordReset, switchDemoRole } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('من فضلك اكتبي اسمك بالكامل.');
        }
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.');
        }
        await register(email, password, fullName, role);
        onClose();
      } else if (mode === 'reset') {
        if (!email) throw new Error('من فضلك ادخلي بريدك الإلكتروني.');
        await sendPasswordReset(email);
        setSuccessMsg('تم إرسال رابط استعادة كلمة السر لإيميلك بنجاح!');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'فشل في إتمام العملية، يرجى المحاولة مرة أخرى.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل. جربي تسجيل الدخول.';
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        msg = 'مزود التحقق بالبريد الإلكتروني قيد التفعيل في Firebase Console، يرجى استخدام الدخول التجريبي السريع أو إعادة المحاولة.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      await switchDemoRole(targetRole);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 text-white text-center relative">
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 left-4 p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/30 mb-3 text-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif-display tracking-wide text-white">
            {mode === 'login' && 'أهلاً بيكي في أورا'}
            {mode === 'register' && 'انضمي لمنصة ميك أب آرتست مصر'}
            {mode === 'reset' && 'استعادة كلمة المرور'}
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
            {mode === 'login' && 'سجلي دخولك لمتابعة حجوزاتك ومحادثاتك مع الميك أب آرتست.'}
            {mode === 'register' && 'احجزي أشطر الميك أب آرتستس أو اعرضي شغلك واستقبلي زباين وعرايس.'}
            {mode === 'reset' && 'اكتبي بريدك الإلكتروني وهنبعتلك رابط إعادة تعيين كلمة السر.'}
          </p>
        </div>

        {/* Demo Fast-Login Section */}
        <div className="bg-amber-50/50 border-b border-amber-100 p-3.5 text-center">
          <div className="text-[11px] font-bold text-amber-900 mb-2 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            دخول تجريبي سريع بنقرة واحدة (بدون كلمة سر):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-client-btn"
              type="button"
              onClick={() => handleDemoSwitch('client')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100/50 text-stone-800 border border-amber-200 rounded-lg shadow-xs hover:border-amber-400 transition-all text-center"
            >
              تجربة عميلة 👩
            </button>
            <button
              id="demo-artist-btn"
              type="button"
              onClick={() => handleDemoSwitch('artist')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100/50 text-stone-800 border border-amber-200 rounded-lg shadow-xs hover:border-amber-400 transition-all text-center"
            >
              تجربة آرتست 💄
            </button>
            <button
              id="demo-admin-btn"
              type="button"
              onClick={() => handleDemoSwitch('admin')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100/50 text-stone-800 border border-amber-200 rounded-lg shadow-xs hover:border-amber-400 transition-all text-center"
            >
              تجربة الإدارة 🛡️
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode !== 'reset' && (
            <div className="flex border-b border-stone-200 mb-5">
              <button
                id="auth-tab-login"
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
                  mode === 'login'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                id="auth-tab-register"
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
                  mode === 'register'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                حساب جديد
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    عايزة تنضمي للمنصة كـ:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        role === 'client'
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="font-bold">عميلة أو عروسة</span>
                      <span className="text-[10px] opacity-75">حجز مواعيد وميك أب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('artist')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        role === 'artist'
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="font-bold">ميك أب آرتست</span>
                      <span className="text-[10px] opacity-75">عرض لوكات واستقبال حجوزات</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">الاسم بالكامل</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                    <input
                      id="register-fullname-input"
                      type="text"
                      required
                      placeholder="مثال: ياسمين محمد"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700">كلمة المرور</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-[11px] text-amber-700 hover:underline"
                    >
                      نسيتي كلمة السر؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? 'جارِ التحميل...' : mode === 'login' ? 'تسجيل الدخول' : mode === 'register' ? 'إنشاء الحساب الآن' : 'إرسال رابط الاستعادة'}
            </button>
          </form>

          {mode === 'reset' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-stone-600 hover:text-stone-900 hover:underline"
              >
                الرجوع لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
