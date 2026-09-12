import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/common/Header';
import { AuthModal } from './components/common/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { DiscoverView } from './pages/DiscoverView';
import { ArtistProfileView } from './pages/ArtistProfileView';
import { ClientDashboard } from './pages/ClientDashboard';
import { ArtistDashboard } from './pages/ArtistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LegalPages } from './pages/LegalPages';
import { seedMarketplaceDatabase } from './services/firebase/seedData';
import { getArtists } from './services/artists/artistService';

type ViewType =
  | 'landing'
  | 'discover'
  | 'artist-profile'
  | 'client-dashboard'
  | 'artist-dashboard'
  | 'admin'
  | 'legal';

interface NavigationState {
  view: ViewType;
  params?: any;
}

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [navState, setNavState] = useState<NavigationState>({ view: 'landing' });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [initialSeedChecked, setInitialSeedChecked] = useState(false);

  // Auto-seed initial data if RTDB is completely blank on first boot
  useEffect(() => {
    const checkAndSeed = async () => {
      try {
        const existingArtists = await getArtists();
        if (existingArtists.length === 0) {
          console.log('Seeding initial demo marketplace data...');
          await seedMarketplaceDatabase();
        }
      } catch (err) {
        console.warn('Initial seed check error:', err);
      } finally {
        setInitialSeedChecked(true);
      }
    };

    checkAndSeed();
  }, []);

  const handleNavigate = (view: string, params?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNavState({ view: view as ViewType, params });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-stone-900 selection:bg-rose-200 selection:text-rose-950 font-sans">
      
      {/* Universal Fixed/Sticky Header */}
      <Header
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        currentView={navState.view}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {navState.view === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {navState.view === 'discover' && (
          <DiscoverView
            onNavigate={handleNavigate}
            initialCategory={navState.params?.category}
            initialSearchQuery={navState.params?.query}
            initialLocation={navState.params?.location}
          />
        )}

        {navState.view === 'artist-profile' && navState.params?.artistId && (
          <ArtistProfileView
            artistId={navState.params.artistId}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {navState.view === 'client-dashboard' && (
          <ClientDashboard
            initialTab={navState.params?.tab || 'bookings'}
            initialConvId={navState.params?.convId}
            onNavigate={handleNavigate}
          />
        )}

        {navState.view === 'artist-dashboard' && (
          <ArtistDashboard
            initialTab={navState.params?.tab || 'bookings'}
            onNavigate={handleNavigate}
          />
        )}

        {navState.view === 'admin' && (
          <AdminDashboard
            onNavigate={handleNavigate}
          />
        )}

        {navState.view === 'legal' && (
          <LegalPages
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Universal Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
