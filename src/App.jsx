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

const CURRENT_VERSION_TIMESTAMP = 1724598500000;

function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [latestVersionData, setLatestVersionData] = useState(null);

  // ✅ Redirect root path
  useEffect(() => {
    if (location.pathname === "/") {
      window.history.replaceState(null, "", user ? "/dashboard" : "/login");
    }
  }, [location.pathname, user]);

  // Instant server version check on app launch (works on Web, APK, Login page, Dashboard)
  useEffect(() => {
    const checkServerVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const localTimestamp = Number(localStorage.getItem('app_installed_timestamp')) || CURRENT_VERSION_TIMESTAMP;
          if (data.timestamp && data.timestamp > localTimestamp) {
            console.log('🚀 Server version is newer:', data);
            setLatestVersionData(data);
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.warn('Version check error:', err);
      }
    };

    checkServerVersion();

    // Check version whenever user switches focus back to the app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Enhanced service worker & auto update checking
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          setSwRegistration(registration);
          registration.update().catch(() => {});

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

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
    if (latestVersionData?.timestamp) {
      localStorage.setItem('app_installed_timestamp', latestVersionData.timestamp.toString());
    } else {
      localStorage.setItem('app_installed_timestamp', Date.now().toString());
    }

    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload(true);
  };

  // Render Update Modal component so it works over loading screen & routes
  const renderUpdateModal = () => {
    if (!updateAvailable) return null;
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-emerald-500/50 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 text-white animate-bounce-short">
            <Sparkles className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
            New Update Available! 🎉
          </h3>
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">
            A fresh update for <strong>D S Musics</strong> is available! Tap below to update and load the latest features instantly.
          </p>

          <button
            onClick={handleApplyUpdate}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            Update App Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderUpdateModal()}
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
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

          <Route path="/contact" element={user ? <ContactPage /> : <Navigate to="/login" replace />} />
          <Route path="/privacy" element={user ? <PrivacyPolicyPage /> : <Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;