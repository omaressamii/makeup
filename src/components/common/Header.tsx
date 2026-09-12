import React, { useState } from 'react';
import { Sparkles, Heart, Calendar, MessageSquare, Shield, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '../../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, extra?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { currentUser, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleLabel = (r?: string | null) => {
    if (r === 'admin') return 'الإدارة';
    if (r === 'artist') return 'ميك أب آرتست';
    return 'عميلة';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-900 to-amber-900 flex items-center justify-center text-amber-300 shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-serif-display tracking-tight text-stone-900 block leading-none">
              أورا AURA
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-amber-800 block mt-0.5">
              ميك أب آرتست مصر
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            id="nav-discover"
            onClick={() => onNavigate('discover')}
            className={`hover:text-stone-900 transition-colors ${currentView === 'discover' ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5' : ''}`}
          >
            تصفحي الآرتستس
          </button>
          <button
            id="nav-how-it-works"
            onClick={() => onNavigate('how-it-works')}
            className={`hover:text-stone-900 transition-colors ${currentView === 'how-it-works' ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5' : ''}`}
          >
            إزاي بنشتغل؟
          </button>

          {currentUser && role === 'client' && (
            <>
              <button
                id="nav-client-favorites"
                onClick={() => onNavigate('client-dashboard', { tab: 'favorites' })}
                className={`flex items-center gap-1.5 hover:text-stone-900 transition-colors ${currentView === 'client-dashboard' ? 'text-stone-900 font-semibold' : ''}`}
              >
                <Heart className="w-4 h-4 text-rose-500" />
                المفضلة
              </button>
              <button
                id="nav-client-bookings"
                onClick={() => onNavigate('client-dashboard', { tab: 'bookings' })}
                className={`flex items-center gap-1.5 hover:text-stone-900 transition-colors ${currentView === 'client-dashboard' ? 'text-stone-900 font-semibold' : ''}`}
              >
                <Calendar className="w-4 h-4 text-amber-700" />
                حجوزاتي
              </button>
            </>
          )}

          {currentUser && role === 'artist' && (
            <button
              id="nav-artist-studio"
              onClick={() => onNavigate('artist-dashboard')}
              className={`flex items-center gap-1.5 text-stone-900 font-semibold hover:text-amber-800 transition-colors ${currentView === 'artist-dashboard' ? 'underline underline-offset-4 decoration-amber-600' : ''}`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              استوديو الآرتست
            </button>
          )}

          {currentUser && role === 'admin' && (
            <button
              id="nav-admin-portal"
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 text-amber-900 font-semibold hover:text-amber-700 transition-colors ${currentView === 'admin' ? 'underline underline-offset-4 decoration-amber-600' : ''}`}
            >
              <Shield className="w-4 h-4 text-amber-700" />
              لوحة الإدارة
            </button>
          )}

          {currentUser && (
            <button
              id="nav-messages"
              onClick={() => onNavigate(role === 'artist' ? 'artist-dashboard' : 'client-dashboard', { tab: 'messages' })}
              className="flex items-center gap-1.5 hover:text-stone-900 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-sky-600" />
              المحادثات
            </button>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Real-time Notifications */}
          {currentUser && (
            <NotificationDropdown
              onNavigate={(link) => {
                if (link.includes('artist')) onNavigate('artist-dashboard', { tab: 'bookings' });
                else if (link.includes('client')) onNavigate('client-dashboard', { tab: 'bookings' });
                else onNavigate('discover');
              }}
            />
          )}

          {/* User Profile or Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-100 transition-colors"
              >
                <img
                  src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-stone-300"
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-stone-200 z-40 py-2 text-sm">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-semibold text-stone-900 truncate">{currentUser.displayName}</p>
                      <p className="text-xs text-stone-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </div>

                    {role === 'client' && (
                      <button
                        onClick={() => { setUserDropdownOpen(false); onNavigate('client-dashboard'); }}
                        className="w-full px-4 py-2 text-right text-stone-700 hover:bg-stone-50 flex items-center gap-2 text-xs"
                      >
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        لوحة تحكم حجوزاتي
                      </button>
                    )}

                    {role === 'artist' && (
                      <button
                        onClick={() => { setUserDropdownOpen(false); onNavigate('artist-dashboard'); }}
                        className="w-full px-4 py-2 text-right text-stone-700 hover:bg-stone-50 flex items-center gap-2 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        استوديو الميك أب آرتست
                      </button>
                    )}

                    {role === 'admin' && (
                      <button
                        onClick={() => { setUserDropdownOpen(false); onNavigate('admin'); }}
                        className="w-full px-4 py-2 text-right text-stone-700 hover:bg-stone-50 flex items-center gap-2 text-xs"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        لوحة تحكم الإدارة العامة
                      </button>
                    )}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        id="user-logout-btn"
                        onClick={() => { setUserDropdownOpen(false); logout(); }}
                        className="w-full px-4 py-2 text-right text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors"
              >
                تسجيل الدخول
              </button>
              <button
                id="header-register-btn"
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs"
              >
                انضمي كآرتست
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2">
          <button
            onClick={() => { onNavigate('discover'); setMobileMenuOpen(false); }}
            className="w-full py-2 text-right font-medium text-stone-700 hover:text-stone-900"
          >
            تصفحي الآرتستس
          </button>
          <button
            onClick={() => { onNavigate('how-it-works'); setMobileMenuOpen(false); }}
            className="w-full py-2 text-right font-medium text-stone-700 hover:text-stone-900"
          >
            إزاي بنشتغل؟
          </button>
          {currentUser && role === 'client' && (
            <>
              <button
                onClick={() => { onNavigate('client-dashboard', { tab: 'favorites' }); setMobileMenuOpen(false); }}
                className="w-full py-2 text-right font-medium text-stone-700 hover:text-stone-900 flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                المفضلة
              </button>
              <button
                onClick={() => { onNavigate('client-dashboard', { tab: 'bookings' }); setMobileMenuOpen(false); }}
                className="w-full py-2 text-right font-medium text-stone-700 hover:text-stone-900 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-amber-700" />
                حجوزاتي
              </button>
            </>
          )}
          {currentUser && role === 'artist' && (
            <button
              onClick={() => { onNavigate('artist-dashboard'); setMobileMenuOpen(false); }}
              className="w-full py-2 text-right font-medium text-stone-900 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              استوديو الميك أب آرتست
            </button>
          )}
          {currentUser && role === 'admin' && (
            <button
              onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
              className="w-full py-2 text-right font-medium text-amber-900 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-700" />
              لوحة تحكم الإدارة العامة
            </button>
          )}
          {!currentUser && (
            <div className="pt-2 border-t border-stone-100 flex gap-2">
              <button
                onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center text-xs font-semibold border border-stone-300 rounded-xl"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center text-xs font-semibold bg-stone-900 text-white rounded-xl"
              >
                انضمي كآرتست
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
