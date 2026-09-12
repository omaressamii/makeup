import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Tag,
  Sparkles,
  Search,
  Trash2,
  Database,
  Edit3,
  Lock,
  Check,
  UserCheck,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Mail
} from 'lucide-react';
import {
  UserProfile,
  MakeupArtist,
  Booking,
  UserReport,
  AuditLog,
  ServiceCategory,
  UserRole,
  UserPermissions
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  getAdminStatistics,
  getAllUsers,
  toggleUserStatus,
  reviewArtistApplication,
  toggleArtistBadges,
  getReports,
  updateReportStatus,
  saveCategory,
  deleteCategory,
  getAuditLogs,
  updateUserAndPermissions,
  deleteUserByAdmin,
  sendResetPasswordEmailByAdmin,
  AdminUserUpdatePayload
} from '../services/admin/adminService';
import { getArtists, getCategories } from '../services/artists/artistService';
import { getAllBookings } from '../services/bookings/bookingService';
import { seedMarketplaceDatabase } from '../services/firebase/seedData';

interface AdminDashboardProps {
  onNavigate: (view: string, extra?: any) => void;
}

const statusArabicMap: Record<string, string> = {
  all: 'الكل',
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  approved: 'معتمد',
  rejected: 'مرفوض',
  suspended: 'موقوف',
  active: 'نشط',
  resolved: 'تم الحل',
  dismissed: 'تم التجاهل'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [artists, setArtists] = useState<MakeupArtist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search queries for tables
  const [userSearch, setUserSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Re-seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sData, uData, aData, bData, rData, cData, lData] = await Promise.all([
        getAdminStatistics(),
        getAllUsers(),
        getArtists(),
        getAllBookings(),
        getReports(),
        getCategories(),
        getAuditLogs()
      ]);

      setStats(sData);
      setUsers(uData);
      setArtists(aData);
      setBookings(bData);
      setReports(rData);
      setCategories(cData);
      setAuditLogs(lData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Artist review action
  const handleReviewArtist = async (artistId: string, status: 'approved' | 'rejected' | 'suspended') => {
    if (!currentUser) return;
    const notes = window.prompt(
      `ملاحظات المراجعة للآرتست (اختياري):`,
      status === 'approved' ? 'الملف ومعرض الأعمال مستوفٍ لمعايير الجودة والاحترافية.' : 'الملف يحتاج استكمال بيانات أو صور أكثر وضوحاً.'
    );
    await reviewArtistApplication(artistId, status, { id: currentUser.uid, name: currentUser.displayName }, notes || undefined);
    await loadAdminData();
  };

  // Toggle Featured or Verified
  const handleToggleBadge = async (artistId: string, currentVerified: boolean, currentFeatured: boolean, type: 'verified' | 'featured') => {
    if (!currentUser) return;
    const updates = type === 'verified'
      ? { isVerified: !currentVerified }
      : { isFeatured: !currentFeatured };
    await toggleArtistBadges(artistId, updates, { id: currentUser.uid, name: currentUser.displayName });
    await loadAdminData();
  };

  // Toggle user suspension
  const handleToggleUser = async (userId: string, currentStatus: string) => {
    if (!currentUser) return;
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await toggleUserStatus(userId, newStatus, { id: currentUser.uid, name: currentUser.displayName });
    await loadAdminData();
  };

  // User Edit & Permissions Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('client');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canBook: true,
    canMessage: true,
    canReview: true,
    canManageServices: false,
    canManagePortfolio: false,
    isAdmin: false
  });
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userModalMsg, setUserModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenEditUser = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setEditDisplayName(user.displayName || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'client');
    setEditStatus(user.status || 'active');
    setEditPhone(user.phone || '');
    setEditCity(user.city || '');
    setEditNotes(user.notes || '');
    setEditNewPassword('');
    setShowPasswordText(false);

    const defaultPerms: UserPermissions = {
      canBook: user.permissions?.canBook ?? true,
      canMessage: user.permissions?.canMessage ?? true,
      canReview: user.permissions?.canReview ?? true,
      canManageServices: user.permissions?.canManageServices ?? (user.role === 'artist'),
      canManagePortfolio: user.permissions?.canManagePortfolio ?? (user.role === 'artist'),
      isAdmin: user.permissions?.isAdmin ?? (user.role === 'admin')
    };
    setEditPermissions(defaultPerms);
    setUserModalMsg(null);
    setEditUserModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditNewPassword(pass);
    setShowPasswordText(true);
  };

  const handleSendPasswordResetEmail = async () => {
    if (!selectedUserForEdit || !currentUser || !selectedUserForEdit.email) return;
    setSendingResetEmail(true);
    setUserModalMsg(null);
    try {
      await sendResetPasswordEmailByAdmin(selectedUserForEdit.email, selectedUserForEdit.uid, {
        id: currentUser.uid,
        name: currentUser.displayName
      });
      setUserModalMsg({
        type: 'success',
        text: `تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى البريد: ${selectedUserForEdit.email}`
      });
    } catch (err: any) {
      setUserModalMsg({
        type: 'error',
        text: 'تعذر إرسال الرابط: ' + (err.message || 'حدث خطأ غير متوقع.')
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setEditRole(newRole);
    setEditPermissions(prev => ({
      ...prev,
      canBook: true,
      canMessage: true,
      canReview: true,
      canManageServices: newRole === 'artist' || newRole === 'admin',
      canManagePortfolio: newRole === 'artist' || newRole === 'admin',
      isAdmin: newRole === 'admin'
    }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit || !currentUser) return;
    if (!editDisplayName.trim()) {
      setUserModalMsg({ type: 'error', text: 'يرجى إدخال اسم المستخدم.' });
      return;
    }
    if (editNewPassword.trim() && editNewPassword.trim().length < 6) {
      setUserModalMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن لا تقل عن 6 خانات.' });
      return;
    }

    setSavingUser(true);
    setUserModalMsg(null);
    try {
      await updateUserAndPermissions(
        selectedUserForEdit.uid,
        {
          displayName: editDisplayName.trim(),
          email: editEmail.trim(),
          role: editRole,
          status: editStatus,
          phone: editPhone.trim(),
          city: editCity.trim(),
          notes: editNotes.trim(),
          newPassword: editNewPassword.trim() || undefined,
          permissions: editPermissions
        },
        { id: currentUser.uid, name: currentUser.displayName }
      );

      const successMsg = editNewPassword.trim()
        ? 'تم تحديث بيانات المستخدم، الصلاحيات، وكلمة المرور بنجاح!'
        : 'تم تحديث بيانات المستخدم وصلاحياته بنجاح!';
      setUserModalMsg({ type: 'success', text: successMsg });
      await loadAdminData();
      setTimeout(() => {
        setEditUserModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setUserModalMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ التعديلات.' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم وجميع بياناته نهائياً من المنصة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setSavingUser(true);
      try {
        await deleteUserByAdmin(userId, { id: currentUser.uid, name: currentUser.displayName });
        setEditUserModalOpen(false);
        await loadAdminData();
      } catch (err: any) {
        alert('حدث خطأ أثناء حذف المستخدم: ' + err.message);
      } finally {
        setSavingUser(false);
      }
    }
  };

  // Report resolution
  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!currentUser) return;
    const notes = window.prompt(
      'ملاحظات الإدارة حول الإجراء المتخذ:',
      status === 'resolved' ? 'تمت مراجعة البلاغ واتخاذ الإجراء المناسب.' : 'تم فحص البلاغ والتأكد من سلامة المحتوى.'
    );
    await updateReportStatus(reportId, status, notes || '', { id: currentUser.uid, name: currentUser.displayName });
    await loadAdminData();
  };

  // Add Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await saveCategory({ name: catName.trim(), description: catDesc.trim(), isActive: true });
    setCatModalOpen(false);
    setCatName('');
    setCatDesc('');
    await loadAdminData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('هل متأكد من حذف هذا القسم؟')) {
      await deleteCategory(id);
      await loadAdminData();
    }
  };

  // Seed / Reset Database
  const handleSeedDatabase = async () => {
    if (window.confirm('هل تريد إعادة تعيين وتعبئة قاعدة البيانات بالآرتستس والبيانات التجريبية المصرية؟')) {
      setSeeding(true);
      setSeedSuccessMsg(null);
      try {
        await seedMarketplaceDatabase();
        setSeedSuccessMsg('تم تحديث وتعبئة قاعدة البيانات بنجاح بالآرتستس والحجوزات التجريبية!');
        await loadAdminData();
      } catch (err: any) {
        setSeedSuccessMsg('حدث خطأ أثناء التعبئة: ' + err.message);
      } finally {
        setSeeding(false);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
            <Shield className="w-3.5 h-3.5" />
            إدارة وحماية منصة الميك أب آرتست
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
            بوابة الإدارة العامة
          </h1>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            التحكم الشامل في قاعدة البيانات الحية، تدقيق طلبات توثيق الآرتستس، ومراقبة الحجوزات وبلاغات الأمان.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {seeding ? 'جارِ التهيئة...' : 'إعادة تعيين البيانات التجريبية'}
          </button>
        </div>
      </div>

      {seedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">إجمالي المستخدمين</span>
            <span className="text-2xl font-bold font-serif-display text-stone-900 mt-1 block">{stats.totalUsers}</span>
            <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">{stats.totalClients} عميلة مسجلة</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">إجمالي الآرتستس</span>
            <span className="text-2xl font-bold font-serif-display text-stone-900 mt-1 block">{stats.totalArtists}</span>
            <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">{stats.pendingArtists} بانتظار المراجعة</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">إجمالي الحجوزات</span>
            <span className="text-2xl font-bold font-serif-display text-stone-900 mt-1 block">{stats.totalBookings}</span>
            <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">{stats.completedBookings} حجز مكتمل</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">الأرباح التقديرية</span>
            <span className="text-2xl font-bold font-serif-display text-emerald-700 mt-1 block">{stats.totalRevenue} ج.م</span>
            <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">من الحجوزات المؤكدة</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">متوسط التقييم</span>
            <span className="text-2xl font-bold font-serif-display text-stone-900 mt-1 block" dir="ltr">{stats.avgRating} ★</span>
            <span className="text-[10px] text-stone-500 mt-0.5 block font-medium">{stats.totalReviews} تقييم موثق</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-400 font-medium block">بلاغات الأمان</span>
            <span className="text-2xl font-bold font-serif-display text-rose-700 mt-1 block">{stats.pendingReports}</span>
            <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">بانتظار الإجراء</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          نظرة عامة
        </button>

        <button
          onClick={() => setActiveTab('artists')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'artists'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          طلبات توثيق الآرتستس ({artists.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Users className="w-4 h-4" />
          دليل المستخدمين ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          سجل الحجوزات ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          بلاغات الأمان ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Tag className="w-4 h-4" />
          أقسام الخدمات ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          سجل العمليات والتدقيق
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Rated Artists */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold font-serif-display text-base text-stone-900">
              أعلى الآرتستس تقييماً واعتماداً
            </h3>
            <div className="divide-y divide-stone-100">
              {stats.topArtists.map((a: MakeupArtist) => (
                <div key={a.artistId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={a.profileImage}
                      alt={a.fullName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-stone-900">{a.fullName}</h5>
                      <span className="text-[11px] text-stone-400">{a.location} • {a.rating} ★</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-stone-800 block">{a.reviewCount} تقييم</span>
                    <button
                      onClick={() => onNavigate('artist-profile', { artistId: a.artistId })}
                      className="text-[11px] text-amber-700 hover:underline font-semibold"
                    >
                      عرض البروفايل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings Activity */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold font-serif-display text-base text-stone-900">
              أحدث نشاط الحجوزات في المنصة
            </h3>
            <div className="divide-y divide-stone-100">
              {stats.recentBookings.map((b: Booking) => (
                <div key={b.bookingId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">{b.serviceName}</span>
                    <span className="text-stone-500 text-[11px]">
                      {b.clientName} ← {b.artistName} • {b.date}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-stone-900 font-serif-display block">{b.price} ج.م</span>
                    <span className="text-[10px] font-bold text-stone-500">{statusArabicMap[b.status] || b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Artist Applications */}
      {activeTab === 'artists' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {artists.map((art) => (
              <div
                key={art.artistId}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={art.profileImage}
                    alt={art.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold font-serif-display text-sm text-stone-900">{art.fullName}</h4>
                      <span className="text-xs text-stone-400 font-mono text-left" dir="ltr">@{art.username}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          art.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : art.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {statusArabicMap[art.status] || art.status}
                      </span>
                      {art.isVerified && (
                        <span className="px-1.5 py-0.2 rounded bg-stone-900 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          موثقة
                        </span>
                      )}
                      {art.isFeatured && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          مميزة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {art.location} • خبرة {art.experienceYears} سنوات • التقييم: {art.rating} ★ ({art.reviewCount})
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-1 mt-1 max-w-xl">{art.bio}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onNavigate('artist-profile', { artistId: art.artistId })}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    عرض الصفحة
                  </button>

                  {/* Verification toggle */}
                  <button
                    onClick={() => handleToggleBadge(art.artistId, !!art.isVerified, !!art.isFeatured, 'verified')}
                    className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {art.isVerified ? 'إلغاء التوثيق' : 'منح التوثيق الرسمي'}
                  </button>

                  {/* Featured toggle */}
                  <button
                    onClick={() => handleToggleBadge(art.artistId, !!art.isVerified, !!art.isFeatured, 'featured')}
                    className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {art.isFeatured ? 'إلغاء التمييز' : 'تمييز في الرئيسية'}
                  </button>

                  {art.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReviewArtist(art.artistId, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        قبول واعتماد
                      </button>
                      <button
                        onClick={() => handleReviewArtist(art.artistId, 'rejected')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        رفض
                      </button>
                    </>
                  )}

                  {art.status === 'approved' && (
                    <button
                      onClick={() => handleReviewArtist(art.artistId, 'suspended')}
                      className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      إيقاف مؤقت
                    </button>
                  )}

                  {art.status === 'suspended' && (
                    <button
                      onClick={() => handleReviewArtist(art.artistId, 'approved')}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold"
                    >
                      إعادة تفعيل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Users Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني أو نوع الحساب..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none text-right"
              />
            </div>
            <span className="text-xs text-stone-500 font-bold">
              {filteredUsers.length} مستخدم
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200 font-bold">
                <tr>
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">نوع الحساب</th>
                  <th className="py-3 px-4">المدينة</th>
                  <th className="py-3 px-4">تاريخ التسجيل</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{u.displayName}</div>
                      <div className="text-stone-400 text-[11px] font-mono" dir="ltr">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : u.role === 'artist'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {u.role === 'client' ? 'عميلة' : u.role === 'artist' ? 'ميك أب آرتست' : 'مدير منصة (Admin)'}
                        </span>
                        {u.permissions && (
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                            {u.permissions.canBook && (
                              <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px]" title="مسموح بالحجز">
                                حجز
                              </span>
                            )}
                            {u.permissions.canMessage && (
                              <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px]" title="مسموح بالمراسلة">
                                مراسلة
                              </span>
                            )}
                            {u.permissions.canReview && (
                              <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px]" title="مسموح بالتقييم">
                                تقييم
                              </span>
                            )}
                            {u.permissions.canManageServices && (
                              <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px]" title="إدارة الخدمات">
                                خدمات
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{u.city || 'غير محدد'}</td>
                    <td className="py-3 px-4 text-stone-400">
                      {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {statusArabicMap[u.status] || u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="تعديل بيانات المستخدم، تعيين كلمة المرور، والصلاحيات"
                        >
                          <Edit3 className="w-3 h-3 text-amber-300" />
                          <Key className="w-3 h-3 text-amber-300" />
                          <span>تعديل وأمان وصلاحيات</span>
                        </button>

                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUser(u.uid, u.status)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                              u.status === 'suspended'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-stone-200 hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.status === 'suspended' ? 'إلغاء الإيقاف' : 'إيقاف'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: All Bookings */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-1.5">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    bookingFilter === st ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {statusArabicMap[st] || st}
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-500 font-medium">
              يتم عرض {filteredBookings.length} حجز
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200 font-bold">
                <tr>
                  <th className="py-3 px-4">الخدمة</th>
                  <th className="py-3 px-4">العميلة</th>
                  <th className="py-3 px-4">الميك أب آرتست</th>
                  <th className="py-3 px-4">تاريخ ووقت الميعاد</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-bold text-stone-900">{b.serviceName}</td>
                    <td className="py-3 px-4 text-stone-700">{b.clientName}</td>
                    <td className="py-3 px-4 text-stone-700">{b.artistName}</td>
                    <td className="py-3 px-4 text-stone-500 font-medium" dir="ltr">{b.date} @ {b.startTime}</td>
                    <td className="py-3 px-4 font-bold font-serif-display text-stone-900">{b.price} ج.م</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Content Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              مفيش أي بلاغات أو شكاوى مقدمة حالياً. سجل المنصة نظيف وآمن تماماً!
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.reportId}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-xs text-stone-900">
                      بلاغ ضد {rep.targetType === 'artist' ? 'الآرتست' : 'المحتوى'}: {rep.targetTitle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {statusArabicMap[rep.status] || rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium">"{rep.reason}"</p>
                  <span className="text-[11px] text-stone-400 block">
                    مقدم البلاغ: {rep.reporterName} في {new Date(rep.createdAt).toLocaleString('ar-EG')}
                  </span>
                  {rep.adminNotes && (
                    <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded-lg mt-1">
                      ملاحظة الإدارة: {rep.adminNotes}
                    </p>
                  )}
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleReportAction(rep.reportId, 'resolved')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      اتخاذ إجراء وحل
                    </button>
                    <button
                      onClick={() => handleReportAction(rep.reportId, 'dismissed')}
                      className="px-3.5 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      تجاهل البلاغ
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Service Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold font-serif-display text-base text-stone-900">أقسام وتصنيفات المنصة</h3>
              <p className="text-xs text-stone-500">التصنيفات المستخدمة لتنظيم وتصفية خدمات ولوكات الميك أب.</p>
            </div>
            <button
              onClick={() => setCatModalOpen(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              إضافة قسم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-stone-900">{c.name}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">{c.description || 'بدون وصف'}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-stone-400 hover:text-rose-600 transition-colors"
                  title="حذف التصنيف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold font-serif-display text-base text-stone-900">
            سجل العمليات والتدقيق في الوقت الفعلي
          </h3>
          <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto pl-2">
            {auditLogs.map((log) => (
              <div key={log.logId} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{log.action}</span>
                  <span className="text-stone-500 text-[11px] block">
                    المنفذ: {log.actorName} ({log.actorRole}) • الهدف: {log.targetType} #{log.targetId.slice(0, 8)}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono text-left" dir="ltr">
                  {new Date(log.timestamp).toLocaleTimeString('ar-EG')} {new Date(log.timestamp).toLocaleDateString('ar-EG')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-right">
            <h3 className="text-sm font-bold text-stone-900">إضافة قسم خدمات جديد</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">اسم القسم</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ميك أب هالوين وسينمائي"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-right"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">الوصف</label>
                <input
                  type="text"
                  placeholder="وصف مختصر للقسم..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-right"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="flex-1 py-2 text-stone-600 border border-stone-200 rounded-lg font-semibold hover:bg-stone-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors"
                >
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User & Permissions Modal */}
      {editUserModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto border border-stone-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-800">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif-display text-stone-900">
                    تعديل بيانات المستخدم والصلاحيات
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span className="font-mono text-[11px]" dir="ltr">{selectedUserForEdit.email}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-stone-400" dir="ltr">UID: {selectedUserForEdit.uid.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Notification message */}
            {userModalMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  userModalMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {userModalMsg.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{userModalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-6 text-xs">
              {/* 1. Basic Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 border-b border-stone-100 pb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  البيانات الأساسية للمستخدم
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">الاسم بالكامل / الاسم المعروض *</label>
                    <input
                      type="text"
                      required
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">رقم الهاتف للتواصل</label>
                    <input
                      type="tel"
                      placeholder="010XXXXXXXX"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">المدينة / المحافظة</label>
                    <input
                      type="text"
                      placeholder="مثال: القاهرة، الشيخ زايد، الإسكندرية..."
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Account Role */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 border-b border-stone-100 pb-1">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  نوع الحساب والدور الرئيسي
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('client')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      editRole === 'client'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs">👩 عميلة (Client)</span>
                      {editRole === 'client' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <span className={`text-[10px] ${editRole === 'client' ? 'text-stone-300' : 'text-stone-500'}`}>
                      تصفح وحجز المواعيد والتقييم
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('artist')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      editRole === 'artist'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs">💄 ميك أب آرتست (Artist)</span>
                      {editRole === 'artist' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <span className={`text-[10px] ${editRole === 'artist' ? 'text-stone-300' : 'text-stone-500'}`}>
                      تقديم الخدمات واستقبال الحجوزات
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      editRole === 'admin'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs">🛡️ مدير منصة (Admin)</span>
                      {editRole === 'admin' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <span className={`text-[10px] ${editRole === 'admin' ? 'text-stone-300' : 'text-stone-500'}`}>
                      كامل صلاحيات إدارة المنصة
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Status */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-bold">حالة الحساب</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={editStatus === 'active'}
                      onChange={() => setEditStatus('active')}
                      className="w-4 h-4 text-stone-900 focus:ring-stone-900"
                    />
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      نشط ومفعل (Active)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={editStatus === 'suspended'}
                      onChange={() => setEditStatus('suspended')}
                      className="w-4 h-4 text-stone-900 focus:ring-stone-900"
                    />
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      موقوف مؤقتاً (Suspended)
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Password & Security */}
              <div className="space-y-3 bg-stone-50/90 p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>الأمان وتعيين كلمة المرور للحساب</span>
                  </h4>
                  {selectedUserForEdit.passwordUpdatedAt && (
                    <span className="text-[10px] text-stone-400 font-normal">
                      آخر تحديث لكلمة المرور: {new Date(selectedUserForEdit.passwordUpdatedAt).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-stone-700 font-bold">
                    تعيين كلمة مرور جديدة للمستخدم
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        placeholder="اترك الحقل فارغاً للإبقاء على الحالية، أو اكتب كلمة مرور جديدة..."
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-left font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                        title={showPasswordText ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 hover:border-stone-400 transition-colors text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                      title="توليد كلمة مرور عشوائية قوية مكونة من أحرف وأرقام ورموز"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                      <span>توليد تلقائي</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-stone-500">
                      💡 حد أدنى 6 خانات. سيتمكن المستخدم من تسجيل الدخول بها فور حفظ التعديل.
                    </span>

                    {selectedUserForEdit.email && (
                      <button
                        type="button"
                        disabled={sendingResetEmail}
                        onClick={handleSendPasswordResetEmail}
                        className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        <Mail className="w-3 h-3 text-amber-700" />
                        <span>{sendingResetEmail ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين للإيميل'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Permissions Matrix */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 border-b border-stone-100 pb-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  مصفوفة الأذونات والصلاحيات المخصصة
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canBook}
                      onChange={(e) => setEditPermissions({ ...editPermissions, canBook: e.target.checked })}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block">إمكانية الحجز ومواعيد الجلسات</span>
                      <span className="text-[10px] text-stone-500">حجز مواعيد جديدة أو استقبال طلبات العميلات</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canMessage}
                      onChange={(e) => setEditPermissions({ ...editPermissions, canMessage: e.target.checked })}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block">المحادثات والمراسلة المباشرة</span>
                      <span className="text-[10px] text-stone-500">إرسال واستقبال الرسائل والاستفسارات الفورية</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canReview}
                      onChange={(e) => setEditPermissions({ ...editPermissions, canReview: e.target.checked })}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block">كتابة ونشر التقييمات</span>
                      <span className="text-[10px] text-stone-500">السماح بمشاركة التقييمات والتجارب</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canManageServices}
                      onChange={(e) => setEditPermissions({ ...editPermissions, canManageServices: e.target.checked })}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block">إدارة باقات الخدمات والأسعار</span>
                      <span className="text-[10px] text-stone-500">خاص بالآرتست: إضافة وتعديل وتسعير الباقات</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.canManagePortfolio}
                      onChange={(e) => setEditPermissions({ ...editPermissions, canManagePortfolio: e.target.checked })}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-stone-900 block">إدارة معرض اللوكات والصور</span>
                      <span className="text-[10px] text-stone-500">خاص بالآرتست: رفع وتحديث صور الأعمال</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!editPermissions.isAdmin}
                      onChange={(e) => setEditPermissions({ ...editPermissions, isAdmin: e.target.checked })}
                      className="mt-0.5 rounded text-amber-800 focus:ring-amber-800 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-amber-900 block">صلاحيات الإدارة والتحكم الكاملة</span>
                      <span className="text-[10px] text-amber-700">الوصول لبوابة الإدارة وتعديل المستخدمين والبلاغات</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. Internal Notes */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">ملاحظات إدارية خاصة (غير مرئية للمستخدم)</label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات حول التحقق من الهوية أو التنسيق أو أسباب تعديل الصلاحيات..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  disabled={savingUser}
                  onClick={() => handleDeleteUser(selectedUserForEdit.uid)}
                  className="w-full sm:w-auto px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الحساب نهائياً</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={savingUser}
                    onClick={() => setEditUserModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 text-stone-600 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {savingUser ? (
                      <span>جاري الحفظ...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-amber-300" />
                        <span>حفظ التعديلات والصلاحيات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
