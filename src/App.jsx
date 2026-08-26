import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import LikedSongsPage from './pages/LikedSongsPage';
import SettingsPage from './pages/SettingsPage';
import PlaylistPage from './pages/PlaylistsPage';
import AboutMe from './pages/AboutMe';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import InstallPrompt from "./components/InstallPrompt";
import LottieLoader from './components/LottieLoader';
import { Sparkles, RefreshCw } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';

function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // ✅ Redirect root path
  useEffect(() => {
    if (location.pathname === "/") {
      window.history.replaceState(null, "", user ? "/dashboard" : "/login");
    }
  }, [location.pathname, user]);

  // ✅ Handle Android Native Hardware Back Button (Navigate back or minimize app)
  useEffect(() => {
    let backListener = null;
    const setupBackButton = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', () => {
          if (location.pathname !== '/dashboard' && location.pathname !== '/login' && window.history.length > 1) {
            window.history.back();
          } else {
            CapacitorApp.minimizeApp();
          }
        });
      } catch (err) {
        // Not running in Capacitor native — ignore
      }
    };
    setupBackButton();

    return () => {
      if (backListener) backListener.remove();
    };
  }, [location.pathname]);

  // ✅ Service worker registration (non-aggressive — no auto-reload)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          setSwRegistration(registration);
          registration.update().catch(() => {});

          if (registration.waiting) {
            setUpdateAvailable(true);
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(() => {});
    }
  }, []);

  const handleApplyUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload(true);
  };

  // Render non-intrusive update banner
  const renderUpdateBanner = () => {
    if (!updateAvailable) return null;
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Update available</span>
        </div>
        <button
          onClick={handleApplyUpdate}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-all active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          Update
        </button>
      </div>
    );
  };

  return (
    <>
      {renderUpdateBanner()}
      <InstallPrompt />

      {loading ? (
        <LottieLoader />
      ) : (
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" replace />} />
          <Route path="/liked" element={user ? <LikedSongsPage /> : <Navigate to="/login" replace />} />
          <Route path="/playlists" element={user ? <PlaylistPage /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="/about" element={user ? <AboutMe /> : <Navigate to="/login" replace />} />
          <Route path="/contact" element={user ? <ContactPage /> : <Navigate to="/login" replace />} />
          <Route path="/privacy" element={user ? <PrivacyPolicyPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;